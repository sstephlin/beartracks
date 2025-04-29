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

  private List<Map<String, String>> searchCourses(CourseCatalog catalog, String query) {
    List<Map<String, String>> matches = new ArrayList<>();
    String lowerQuery = query.toLowerCase();

    for (Map.Entry<String, CourseInfo> entry : catalog.courseMap.entrySet()) {
      String courseCode = entry.getKey();
      CourseInfo info = entry.getValue();

      if (courseCode.toLowerCase().contains(lowerQuery)
          || info.courseName.toLowerCase().contains(lowerQuery)) {
        Map<String, String> courseData = new HashMap<>();
        courseData.put("courseCode", courseCode);
        courseData.put("courseName", info.courseName);
        matches.add(courseData);
      }
    }
    return matches;
  }
}
