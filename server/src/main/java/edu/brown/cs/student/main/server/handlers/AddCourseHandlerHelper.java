package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.parser.CourseCatalog;
import edu.brown.cs.student.main.server.parser.PrereqTreeNode;
import java.util.*;

public class AddCourseHandlerHelper {

  // Assumes semester keys are like "Fall 22", "Spring 23", etc.
  public static Set<String> getCompletedCourses(
      Map<String, List<String>> semesterMap, String currentSemester) {
    Set<String> completed = new HashSet<>();

    for (Map.Entry<String, List<String>> entry : semesterMap.entrySet()) {
      String semester = entry.getKey();
      if (compareSemesters(semester, currentSemester) < 0) {
        completed.addAll(entry.getValue().stream().map(String::toUpperCase).toList());
      }
    }

    return completed;
  }

  // Simple lexicographical comparison fallback
  // You may improve this with full term ordering logic
  private static int compareSemesters(String a, String b) {
    String[] terms = {"Spring", "Summer", "Fall", "Winter"};
    String[] aParts = a.split(" ");
    String[] bParts = b.split(" ");

    int yearA = Integer.parseInt(aParts[1]);
    int yearB = Integer.parseInt(bParts[1]);

    if (yearA != yearB) return yearA - yearB;

    int termA = Arrays.asList(terms).indexOf(aParts[0]);
    int termB = Arrays.asList(terms).indexOf(bParts[0]);

    return termA - termB;
  }

  public static boolean checkPrerequisites(
      CourseCatalog catalog,
      String courseCode,
      Set<String> completedCourses,
      String semester,
      Map<String, String> courseToSemester) {
    PrereqTreeNode prereqTree = catalog.getPrereqTree(courseCode, semester);
    if (prereqTree == null || prereqTree.isEmpty()) return true;

    return evaluateTree(prereqTree, completedCourses, catalog, courseToSemester);
  }

  private static boolean evaluateTree(
      PrereqTreeNode node,
      Set<String> completed,
      CourseCatalog catalog,
      Map<String, String> courseToSemester) {
    if (node.isLeaf()) {
      String course = node.courseCode.toUpperCase();
      System.out.println(completed);
      if (completed.contains(course)) {
        // Check if this completed course itself has prereqs that are met
        String semester = courseToSemester.get(course);
        PrereqTreeNode subTree = catalog.getPrereqTree(course, semester);
        System.out.println(subTree);
        if (subTree == null || subTree.isEmpty()) {
          System.out.println("base");
          return true; // no prereqs → completed is enough
        }

        // Check recursively if its own prereqs are met
        return evaluateTree(subTree, completed, catalog, courseToSemester);
      }
      return false; // not completed, can't satisfy
    }

    // Internal nodes: AND / OR
    if (node.type == PrereqTreeNode.Type.AND) {
      for (PrereqTreeNode child : node.children) {
        if (!evaluateTree(child, completed, catalog, courseToSemester)) return false;
      }
      return true;
    } else if (node.type == PrereqTreeNode.Type.OR) {
      for (PrereqTreeNode child : node.children) {
        if (evaluateTree(child, completed, catalog, courseToSemester)) return true;
      }
      return false;
    }

    return false; // fallback
  }
}
