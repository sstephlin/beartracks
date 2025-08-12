package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.parser.CourseCatalog;
import edu.brown.cs.student.main.server.parser.PrereqTreeNode;
import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.*;
import spark.Request;
import spark.Response;
import spark.Route;

public class GetPrereqHandler implements Route {
  private final StorageInterface storageHandler;
  private final CourseCatalog catalog;

  public GetPrereqHandler(StorageInterface storageHandler, CourseCatalog catalog) {
    this.storageHandler = storageHandler;
    this.catalog = catalog;
  }

  @Override
  public Object handle(Request request, Response response) throws Exception {
    String uid = request.queryParams("uid");
    String courseCode = request.queryParams("code");
    String term = request.queryParams("term");
    String year = request.queryParams("year");
    // Use 4-digit year format consistently
    String semesterKey = term + " " + year;

    // Get user's course schedule
    Map<String, List<String>> semMap = storageHandler.getAllSemestersAndCourses(uid);
    Map<String, String> courseToSemester = new HashMap<>();
    for (Map.Entry<String, List<String>> entry : semMap.entrySet()) {
      for (String c : entry.getValue()) {
        courseToSemester.put(c.toUpperCase(), entry.getKey());
      }
    }

    // Get prerequisite tree
    PrereqTreeNode prereqTree = catalog.getPrereqTree(courseCode, semesterKey);

    Map<String, Object> out = new HashMap<>();
    out.put("response_type", "success");

    if (prereqTree == null || prereqTree.isEmpty()) {
      out.put("hasPrereqs", false);
      out.put("displayText", "✅ No prerequisites required for " + courseCode);
      out.put("message", "No prerequisites required");
      out.put("overallStatus", "✅ No prerequisites required");
    } else {
      out.put("hasPrereqs", true);

      // Create structured data for box-based display
      Map<String, Object> structuredData =
          convertTreeToDisplayFormat(prereqTree, semesterKey, courseToSemester);

      // Also create readable display text as backup
      String readableText = formatPrereqsForDisplay(prereqTree, semesterKey, courseToSemester, 0);

      out.put("prerequisiteTree", structuredData);
      out.put("displayText", "Prerequisites for " + courseCode + ":\n\n" + readableText);

      // Add summary with enhanced status information
      PrereqStatus status = checkOverallStatus(prereqTree, semesterKey, courseToSemester);
      out.put(
          "overallStatus",
          status.satisfied ? "All prerequisites satisfied" : "Prerequisites not met");
      out.put("summary", status.summary);

      // Add detailed completion information for frontend
      out.put(
          "completionDetails",
          generateCompletionDetails(prereqTree, semesterKey, courseToSemester));
    }

    response.type("application/json");
    return Utils.toMoshiJson(out);
  }

  private String formatPrereqsForDisplay(
      PrereqTreeNode node, String targetSemester, Map<String, String> courseToSemester, int depth) {
    StringBuilder result = new StringBuilder();
    String indent = "  ".repeat(depth);

    if (node.isLeaf()) {
      // This is a course prerequisite
      String prereqCode = node.courseCode.toUpperCase();
      String lookupCode = prereqCode.replace("*", "");
      String prereqSemester = courseToSemester.get(lookupCode);
      boolean isConcurrent = prereqCode.contains("*");

      // Check if prerequisite is satisfied
      boolean satisfied = false;
      if (prereqSemester != null) {
        if (isConcurrent) {
          satisfied = AddCourseHandlerHelper.compareSemesters(prereqSemester, targetSemester) <= 0;
        } else {
          satisfied = AddCourseHandlerHelper.compareSemesters(prereqSemester, targetSemester) < 0;
        }
      }

      // Format the course line
      String status = satisfied ? "✅" : "❌";
      String concurrentText = isConcurrent ? " (can be taken concurrently)" : "";
      String completionText =
          prereqSemester != null ? " - Completed in " + prereqSemester : " - Not completed";

      result
          .append(indent)
          .append(status)
          .append(" ")
          .append(lookupCode)
          .append(concurrentText)
          .append(completionText)
          .append("\n");

    } else {
      // This is an AND/OR node
      String connector = node.type == PrereqTreeNode.Type.AND ? "ALL of:" : "ONE of:";
      result.append(indent).append(connector).append("\n");

      for (int i = 0; i < node.children.size(); i++) {
        PrereqTreeNode child = node.children.get(i);
        result.append(formatPrereqsForDisplay(child, targetSemester, courseToSemester, depth + 1));

        // Add connecting word between children if needed
        if (i < node.children.size() - 1) {
          String connectionWord = node.type == PrereqTreeNode.Type.AND ? "AND" : "OR";
          result
              .append(indent)
              .append("  ")
              .append("--- ")
              .append(connectionWord)
              .append(" ---")
              .append("\n");
        }
      }
    }

    return result.toString();
  }

  private PrereqStatus checkOverallStatus(
      PrereqTreeNode node, String targetSemester, Map<String, String> courseToSemester) {
    List<String> missing = new ArrayList<>();
    List<String> completed = new ArrayList<>();
    boolean satisfied =
        checkNodeSatisfied(node, targetSemester, courseToSemester, missing, completed);

    StringBuilder summary = new StringBuilder();
    if (!completed.isEmpty()) {
      summary.append("✅ Completed: ").append(String.join(", ", completed)).append("\n");
    }
    if (!missing.isEmpty()) {
      summary.append("❌ Missing: ").append(String.join(", ", missing));
    }

    return new PrereqStatus(satisfied, summary.toString());
  }

  private boolean checkNodeSatisfied(
      PrereqTreeNode node,
      String targetSemester,
      Map<String, String> courseToSemester,
      List<String> missing,
      List<String> completed) {
    if (node.isLeaf()) {
      String prereqCode = node.courseCode.toUpperCase();
      String lookupCode = prereqCode.replace("*", "");
      String prereqSemester = courseToSemester.get(lookupCode);

      boolean satisfied = false;
      if (prereqSemester != null) {
        if (prereqCode.contains("*")) {
          satisfied = AddCourseHandlerHelper.compareSemesters(prereqSemester, targetSemester) <= 0;
        } else {
          satisfied = AddCourseHandlerHelper.compareSemesters(prereqSemester, targetSemester) < 0;
        }
      }

      if (satisfied) {
        completed.add(lookupCode);
      } else {
        missing.add(lookupCode);
      }

      return satisfied;
    } else {
      boolean satisfied;
      if (node.type == PrereqTreeNode.Type.AND) {
        satisfied = true;
        for (PrereqTreeNode child : node.children) {
          if (!checkNodeSatisfied(child, targetSemester, courseToSemester, missing, completed)) {
            satisfied = false;
          }
        }
      } else { // OR
        satisfied = false;
        List<String> tempMissing = new ArrayList<>();
        List<String> tempCompleted = new ArrayList<>();

        for (PrereqTreeNode child : node.children) {
          List<String> childMissing = new ArrayList<>();
          List<String> childCompleted = new ArrayList<>();

          if (checkNodeSatisfied(
              child, targetSemester, courseToSemester, childMissing, childCompleted)) {
            satisfied = true;
            completed.addAll(childCompleted);
            break; // For OR, we only need one satisfied
          } else {
            tempMissing.addAll(childMissing);
            tempCompleted.addAll(childCompleted);
          }
        }

        if (!satisfied) {
          missing.addAll(tempMissing);
          completed.addAll(tempCompleted);
        }
      }

      return satisfied;
    }
  }

  private Map<String, Object> convertTreeToDisplayFormat(
      PrereqTreeNode node, String targetSemester, Map<String, String> courseToSemester) {

    Map<String, Object> result = new HashMap<>();

    if (node.isLeaf()) {
      // This is a course prerequisite
      String prereqCode = node.courseCode.toUpperCase();
      String lookupCode = prereqCode.replace("*", "");
      String prereqSemester = courseToSemester.get(lookupCode);

      result.put("type", "course");
      result.put("courseCode", lookupCode);
      result.put("isConcurrent", prereqCode.contains("*"));
      result.put("isCompleted", prereqSemester != null);
      result.put("completedInSemester", prereqSemester);

      // Check if prerequisite is satisfied
      boolean satisfied = false;
      if (prereqSemester != null) {
        if (prereqCode.contains("*")) {
          // Concurrent prerequisite - can be taken in same semester or before
          satisfied = AddCourseHandlerHelper.compareSemesters(prereqSemester, targetSemester) <= 0;
        } else {
          // Regular prerequisite - must be taken before
          satisfied = AddCourseHandlerHelper.compareSemesters(prereqSemester, targetSemester) < 0;
        }
      }
      result.put("satisfied", satisfied);

    } else {
      // This is an AND/OR node
      result.put("type", node.type.toString().toLowerCase());
      List<Map<String, Object>> children = new ArrayList<>();

      for (PrereqTreeNode child : node.children) {
        children.add(convertTreeToDisplayFormat(child, targetSemester, courseToSemester));
      }
      result.put("children", children);

      // Determine if this group is satisfied
      boolean satisfied;
      if (node.type == PrereqTreeNode.Type.AND) {
        satisfied = children.stream().allMatch(child -> (Boolean) child.get("satisfied"));
      } else { // OR
        satisfied = children.stream().anyMatch(child -> (Boolean) child.get("satisfied"));
      }
      result.put("satisfied", satisfied);
    }

    return result;
  }

  /** Generate detailed completion information for enhanced frontend display */
  private Map<String, Object> generateCompletionDetails(
      PrereqTreeNode node, String targetSemester, Map<String, String> courseToSemester) {
    Map<String, Object> details = new HashMap<>();

    List<Map<String, Object>> allCourses = new ArrayList<>();
    collectAllCourses(node, targetSemester, courseToSemester, allCourses);

    details.put("allCourses", allCourses);

    long completedCount =
        allCourses.stream().mapToLong(course -> (Boolean) course.get("satisfied") ? 1L : 0L).sum();

    details.put("completedCount", completedCount);
    details.put("totalCount", allCourses.size());
    details.put(
        "completionPercentage",
        allCourses.isEmpty() ? 100.0 : (double) completedCount / allCourses.size() * 100.0);

    return details;
  }

  /** Recursively collect all individual course requirements */
  private void collectAllCourses(
      PrereqTreeNode node,
      String targetSemester,
      Map<String, String> courseToSemester,
      List<Map<String, Object>> allCourses) {
    if (node.isLeaf()) {
      String prereqCode = node.courseCode.toUpperCase();
      String lookupCode = prereqCode.replace("*", "");
      String prereqSemester = courseToSemester.get(lookupCode);

      Map<String, Object> courseInfo = new HashMap<>();
      courseInfo.put("courseCode", lookupCode);
      courseInfo.put("isConcurrent", prereqCode.contains("*"));
      courseInfo.put("isCompleted", prereqSemester != null);
      courseInfo.put("completedInSemester", prereqSemester);

      boolean satisfied = false;
      if (prereqSemester != null) {
        if (prereqCode.contains("*")) {
          satisfied = AddCourseHandlerHelper.compareSemesters(prereqSemester, targetSemester) <= 0;
        } else {
          satisfied = AddCourseHandlerHelper.compareSemesters(prereqSemester, targetSemester) < 0;
        }
      }
      courseInfo.put("satisfied", satisfied);

      allCourses.add(courseInfo);
    } else {
      for (PrereqTreeNode child : node.children) {
        collectAllCourses(child, targetSemester, courseToSemester, allCourses);
      }
    }
  }

  private static class PrereqStatus {
    final boolean satisfied;
    final String summary;

    PrereqStatus(boolean satisfied, String summary) {
      this.satisfied = satisfied;
      this.summary = summary;
    }
  }
}
