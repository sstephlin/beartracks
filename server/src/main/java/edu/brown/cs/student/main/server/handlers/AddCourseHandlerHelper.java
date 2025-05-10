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
      String prereqCode = node.courseCode.toUpperCase(); // contains * for concurrent courses
      // Strip asterisk when looking up in courseToSemester
      String lookupCode = prereqCode.replace("*", "");
      String prereqSemester =
          courseToSemester.get(lookupCode); // in courseToSemester, all courses are stored without *

      if (prereqSemester == null) {
        return false;
      }

      if (prereqCode.contains("*")) {
        // if concurrent, same semester is allowed
        if (compareSemesters(prereqSemester, targetSemester) > 0) {
          return false;
        }
      } else {
        // otherwise, only check semesters before the current semester
        if (compareSemesters(prereqSemester, targetSemester) >= 0) {
          return false;
        }
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
