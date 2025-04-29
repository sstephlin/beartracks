package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.parser.CourseCatalog;
import edu.brown.cs.student.main.server.parser.CourseInfo;
import edu.brown.cs.student.main.server.parser.PrereqTreeNode;
import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import spark.Request;
import spark.Response;
import spark.Route;

public class AddCourseHandler implements Route {
  private final StorageInterface storageHandler;
  private final CourseCatalog catalog;

  public AddCourseHandler(StorageInterface storageHandler, CourseCatalog catalog) {
    this.storageHandler = storageHandler;
    this.catalog = catalog;
  }

  @Override
  public Object handle(Request request, Response response) throws Exception {
    Map<String, Object> responseMap = new HashMap<>();
    try {
      String uid = request.queryParams("uid");
      String courseCode = request.queryParams("code");
      String courseTitle = request.queryParams("title");
      String term = request.queryParams("term");
      String year = request.queryParams("year");

      if (uid == null || courseCode == null || term == null || year == null) {
        throw new IllegalArgumentException("Missing required query parameters");
      }

      String semesterKey = term + " " + year;

      Set<String> completedCourses = getCompletedCourses(uid, semesterKey);
      boolean prereqsMet = checkPrerequisites(courseCode, completedCourses, semesterKey);

      if (!prereqsMet) {
        responseMap.put("response_type", "failure");
        responseMap.put("error", "Prerequisites not met or course does not exist: " + courseCode);
        response.type("application/json");
        return Utils.toMoshiJson(responseMap);
      }

      Map<String, Object> courseData = new HashMap<>();
      courseData.put("code", courseCode);
      courseData.put("title", courseTitle);

      storageHandler.addDocument(
          uid + "/semesters/" + semesterKey, "courses", courseCode, courseData);

      responseMap.put("response_type", "success");
      responseMap.put("message", "Course " + courseCode + " added to semester " + semesterKey);
    } catch (Exception e) {
      e.printStackTrace();
      responseMap.put("response_type", "failure");
      responseMap.put("error", e.getMessage());
    }

    response.type("application/json");
    return Utils.toMoshiJson(responseMap);
  }

  // helper methods below...
  private boolean checkPrerequisites(
      String courseCode, Set<String> completedCourses, String semesterKey) {
    CourseInfo courseInfo = catalog.courseMap.get(courseCode);
    if (courseInfo == null) return false;
    String treeId = courseInfo.semesterToTreeId.get(semesterKey);
    if (treeId == null) return true;
    PrereqTreeNode prereqTree = catalog.treeMap.get(treeId);
    if (prereqTree == null) return true;
    return evaluateTree(prereqTree, completedCourses);
  }

  private boolean evaluateTree(PrereqTreeNode node, Set<String> completedCourses) {
    if (node.type == PrereqTreeNode.Type.COURSE) return completedCourses.contains(node.courseCode);
    if (node.type == PrereqTreeNode.Type.AND) {
      for (PrereqTreeNode child : node.children)
        if (!evaluateTree(child, completedCourses)) return false;
      return true;
    }
    if (node.type == PrereqTreeNode.Type.OR) {
      for (PrereqTreeNode child : node.children)
        if (evaluateTree(child, completedCourses)) return true;
      return false;
    }
    return true;
  }

  private Set<String> getCompletedCourses(String uid, String currentSemesterKey) throws Exception {
    Map<String, List<String>> semesterToCourses = storageHandler.getAllSemestersAndCourses(uid);
    Set<String> completed = new HashSet<>();
    for (String semester : semesterToCourses.keySet()) {
      if (isSemesterBefore(semester, currentSemesterKey)) {
        completed.addAll(semesterToCourses.get(semester));
      }
    }
    return completed;
  }

  private boolean isSemesterBefore(String semester1, String semester2) {
    String[] parts1 = semester1.split(" ");
    String[] parts2 = semester2.split(" ");
    if (parts1.length != 2 || parts2.length != 2) return false;
    String term1 = parts1[0];
    int year1 = Integer.parseInt(parts1[1]);
    String term2 = parts2[0];
    int year2 = Integer.parseInt(parts2[1]);
    if (year1 < year2) return true;
    if (year1 > year2) return false;
    return term1.equals("Spring") && term2.equals("Fall");
  }
}
