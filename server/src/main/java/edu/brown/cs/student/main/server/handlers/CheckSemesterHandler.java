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

public class CheckSemesterHandler implements Route {
  private final CourseCatalog catalog;

  public CheckSemesterHandler(CourseCatalog catalog) {
    this.catalog = catalog;
  }

  @Override
  public Object handle(Request request, Response response) throws Exception {
    String courseCode = request.queryParams("courseCode");
    Map<String, Object> responseMap = new HashMap<>();

    if (courseCode == null || courseCode.trim().isEmpty()) {
      responseMap.put("result", "error");
      responseMap.put("message", "Missing or empty 'courseCode' parameter.");
      response.type("application/json");
      return Utils.toMoshiJson(responseMap);
    }

    CourseInfo info = catalog.courseMap.get(courseCode);

    if (info == null) {
      responseMap.put("result", "error");
      responseMap.put("message", "Course not found.");
      response.type("application/json");
      return Utils.toMoshiJson(responseMap);
    }

    List<String> offeredSemesters = new ArrayList<>(info.semesterToTreeId.keySet());

    responseMap.put("result", "success");
    responseMap.put("offeredSemesters", offeredSemesters);

    response.type("application/json");
    return Utils.toMoshiJson(responseMap);
  }
}
