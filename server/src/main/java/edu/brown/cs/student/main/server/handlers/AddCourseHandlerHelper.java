package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.parser.CourseCatalog;
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
    String[] terms = {"Winter", "Spring", "Summer", "Fall"};
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
      CourseCatalog catalog, String courseCode, Set<String> completedCourses, String semester) {
    List<String> prereqs = catalog.getPrereqs(courseCode, semester);
    if (prereqs == null || prereqs.isEmpty()) return true;

    for (String prereq : prereqs) {
      if (!completedCourses.contains(prereq.toUpperCase())) {
        return false;
      }
    }

    return true;
  }
}
