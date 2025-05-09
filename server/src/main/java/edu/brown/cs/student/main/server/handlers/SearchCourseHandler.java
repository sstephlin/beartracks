package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.parser.CourseCatalog;
import edu.brown.cs.student.main.server.parser.CourseInfo;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import spark.Request;
import spark.Response;
import spark.Route;

public class SearchCourseHandler implements Route {
  private final CourseCatalog catalog;

  public SearchCourseHandler(CourseCatalog catalog) {
    this.catalog = catalog;
  }

  @Override
  public Object handle(Request request, Response response) throws Exception {
    String query = request.queryParams("query");
    Map<String, Object> responseMap = new HashMap<>();

    if (query == null || query.trim().isEmpty()) {
      responseMap.put("result", "error");
      responseMap.put("message", "Missing or empty 'query' parameter.");
      response.type("application/json");
      return Utils.toMoshiJson(responseMap);
    }

    if (catalog == null) {
      responseMap.put("result", "error");
      responseMap.put("message", "Course catalog not loaded.");
      response.type("application/json");
      return Utils.toMoshiJson(responseMap);
    }

    List<Map<String, String>> matchedCourses = searchCourses(catalog, query);

    System.out.println("Returning " + matchedCourses.size() + " matched courses.");

    if (matchedCourses.isEmpty()) {
      responseMap.put("result", "error");
      responseMap.put("message", "No matching courses found.");
    } else {
      responseMap.put("result", "success");
      responseMap.put("courses", matchedCourses);
    }

    response.type("application/json");
    return Utils.toMoshiJson(responseMap);
  }

  /**
   * searches for a course in the course catalog, given the query parameter of the course code
   *
   * @param catalog
   * @param query
   * @return
   */
  private List<Map<String, String>> searchCourses(CourseCatalog catalog, String query) {
    List<Map<String, String>> matches = new ArrayList<>();
    String normalizedQuery = query.toLowerCase().replaceAll("\\s+", "");

    for (Map.Entry<String, CourseInfo> entry : catalog.courseMap.entrySet()) {
      String courseCode = entry.getKey();
      CourseInfo info = entry.getValue();

      String normalizedCode = courseCode.toLowerCase().replaceAll("\\s+", "");

      if (normalizedCode.contains(normalizedQuery)) {
        Map<String, String> courseData = new HashMap<>();
        courseData.put("courseCode", courseCode);
        courseData.put("courseName", info.courseName);
        matches.add(courseData);
      }
    }

    // Sort two courses by courseCode (which is the key in the Map<String, String>)
    //    matches.sort(
    //        (a, b) -> {
    //          String codeA = a.get("courseCode");
    //          String codeB = b.get("courseCode");
    //
    //          // Split courseCode into department and number
    //          String[] partsA = codeA.split("\\s+");
    //          String[] partsB = codeB.split("\\s+");
    //
    //          String deptA = partsA[0];
    //          String deptB = partsB[0];
    //
    //          int numA = partsA.length > 1 ? Integer.parseInt(partsA[1]) : 0;
    //          int numB = partsB.length > 1 ? Integer.parseInt(partsB[1]) : 0;
    //
    //          int deptCompare = deptA.compareTo(deptB);
    //          return deptCompare != 0 ? deptCompare : Integer.compare(numA, numB);
    //        });

    matches.sort(
        (a, b) -> {
          String codeA = a.get("courseCode");
          String codeB = b.get("courseCode");

          String deptA = codeA.replaceAll("[^A-Za-z]", "");
          String deptB = codeB.replaceAll("[^A-Za-z]", "");

          int numA = extractNumber(codeA);
          int numB = extractNumber(codeB);

          int deptCompare = deptA.compareTo(deptB);
          return deptCompare != 0 ? deptCompare : Integer.compare(numA, numB);
        });

    return matches;
  }

  private int extractNumber(String code) {
    try {
      String numberPart = code.replaceAll("[^0-9]", "");
      return numberPart.isEmpty() ? 0 : Integer.parseInt(numberPart);
    } catch (NumberFormatException e) {
      return 0;
    }
  }
}
