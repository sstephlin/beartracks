// package edu.brown.cs.student.main.server.handlers;
//
// import edu.brown.cs.student.main.server.parser.CourseCatalog;
// import edu.brown.cs.student.main.server.parser.PrereqTreeNode;
// import java.util.*;
//
// public class AddCourseHandlerHelper {
//
//  // Assumes semester keys are like "Fall 22", "Spring 23", etc.
//  public static Set<String> getCompletedCourses(
//      Map<String, List<String>> semesterMap, String currentSemester) {
//    Set<String> completed = new HashSet<>();
//
//    for (Map.Entry<String, List<String>> entry : semesterMap.entrySet()) {
//      String semester = entry.getKey();
//      if (compareSemesters(semester, currentSemester) < 0) {
//        completed.addAll(entry.getValue().stream().map(String::toUpperCase).toList());
//      }
//    }
//
//    return completed;
//  }
//
//  // Simple lexicographical comparison fallback
//  // You may improve this with full term ordering logic
//  private static int compareSemesters(String a, String b) {
//    String[] terms = {"Spring", "Summer", "Fall", "Winter"};
//    String[] aParts = a.split(" ");
//    String[] bParts = b.split(" ");
//
//    int yearA = Integer.parseInt(aParts[1]);
//    int yearB = Integer.parseInt(bParts[1]);
//
//    if (yearA != yearB) return yearA - yearB;
//
//    int termA = Arrays.asList(terms).indexOf(aParts[0]);
//    int termB = Arrays.asList(terms).indexOf(bParts[0]);
//
//    return termA - termB;
//  }
//
//  public static boolean checkPrerequisites(
//      CourseCatalog catalog,
//      String courseCode,
//      Set<String> completedCourses,
//      String semester,
//      Map<String, String> courseToSemester) {
//    PrereqTreeNode prereqTree = catalog.getPrereqTree(courseCode, semester);
//    if (prereqTree == null || prereqTree.isEmpty()) return true;
//
//    return evaluateTree(prereqTree, completedCourses, catalog, courseToSemester);
//  }
//
//  private static boolean evaluateTree(
//      PrereqTreeNode node,
//      Set<String> completed,
//      CourseCatalog catalog,
//      Map<String, String> courseToSemester) {
//    if (node.isLeaf()) {
//      String course = node.courseCode.toUpperCase();
//      if (completed.contains(course)) {
//        // Check if this completed course itself has prereqs that are met
//        String semester = courseToSemester.get(course);
//        PrereqTreeNode subTree = catalog.getPrereqTree(course, semester);
//        if (subTree == null || subTree.isEmpty()) {
//          return true; // no prereqs → completed is enough
//        }
//
//        // Check recursively if its own prereqs are met
//        return evaluateTree(subTree, completed, catalog, courseToSemester);
//      }
//      return false; // not completed, can't satisfy
//    }
//
//    // Internal nodes: AND / OR
//    if (node.type == PrereqTreeNode.Type.AND) {
//      for (PrereqTreeNode child : node.children) {
//        if (!evaluateTree(child, completed, catalog, courseToSemester)) return false;
//      }
//      return true;
//    } else if (node.type == PrereqTreeNode.Type.OR) {
//      for (PrereqTreeNode child : node.children) {
//        if (evaluateTree(child, completed, catalog, courseToSemester)) return true;
//      }
//      return false;
//    }
//
//    return false; // fallback
//  }
// }

package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.parser.CourseCatalog;
import edu.brown.cs.student.main.server.parser.PrereqTreeNode;
import java.util.*;

public class AddCourseHandlerHelper {

  private static final Map<String, Integer> TERM_ORDER =
      Map.of("Spring", 1, "Summer", 2, "Fall", 3, "Winter", 4);

  public static boolean checkPrerequisites(
      CourseCatalog catalog,
      String courseCode,
      String targetSemester, // when the course is being taken
      Map<String, String> courseToSemester // all courseCode -> semester
      ) {
    PrereqTreeNode prereqTree = catalog.getPrereqTree(courseCode, targetSemester);
    if (prereqTree == null || prereqTree.isEmpty()) {
      return true;
    }

    return evaluateTree(prereqTree, targetSemester, courseToSemester, catalog);
  }

  private static boolean evaluateTree(
      PrereqTreeNode node,
      String targetSemester,
      Map<String, String> courseToSemester,
      CourseCatalog catalog) {
    if (node.isLeaf()) {
      String prereqCode = node.courseCode.toUpperCase();
      String prereqSemester = courseToSemester.get(prereqCode);

      if (prereqSemester == null) {
        return false;
      }

      if (compareSemesters(prereqSemester, targetSemester) >= 0) {
        return false;
      }

      // Recursively check prereqs of this prereq
      PrereqTreeNode subTree = catalog.getPrereqTree(prereqCode, prereqSemester);
      if (subTree == null || subTree.isEmpty()) return true;

      return evaluateTree(subTree, prereqSemester, courseToSemester, catalog);
    }

    // Internal nodes: AND / OR
    if (node.type == PrereqTreeNode.Type.AND) {
      for (PrereqTreeNode child : node.children) {
        if (!evaluateTree(child, targetSemester, courseToSemester, catalog)) return false;
      }
      return true;
    } else if (node.type == PrereqTreeNode.Type.OR) {
      for (PrereqTreeNode child : node.children) {
        if (evaluateTree(child, targetSemester, courseToSemester, catalog)) return true;
      }
      return false;
    }

    return false;
  }

  public static int compareSemesters(String a, String b) {
    String[] terms = {"Spring", "Summer", "Fall", "Winter"};
    String[] aParts = a.split(" ");
    String[] bParts = b.split(" ");

    int yearA = Integer.parseInt(aParts[1]);
    int yearB = Integer.parseInt(bParts[1]);

    if (yearA != yearB) return Integer.compare(yearA, yearB);

    int termA = Arrays.asList(terms).indexOf(aParts[0]);
    int termB = Arrays.asList(terms).indexOf(bParts[0]);

    return Integer.compare(termA, termB);
  }
}
