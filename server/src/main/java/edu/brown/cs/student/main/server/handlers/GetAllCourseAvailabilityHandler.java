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

public class GetAllCourseAvailabilityHandler implements Route {
  private final CourseCatalog catalog;

  public GetAllCourseAvailabilityHandler(CourseCatalog catalog) {
    this.catalog = catalog;
  }

  @Override
  public Object handle(Request request, Response response) throws Exception {
    Map<String, Object> responseMap = new HashMap<>();
    Map<String, List<String>> availability = new HashMap<>();

    // Get all course availability from the catalog
    for (Map.Entry<String, CourseInfo> entry : catalog.courseMap.entrySet()) {
      String courseCode = entry.getKey();
      CourseInfo info = entry.getValue();
      availability.put(courseCode, new ArrayList<>(info.semesterToTreeId.keySet()));
    }

    responseMap.put("result", "success");
    responseMap.put("availability", availability);

    response.type("application/json");
    return Utils.toMoshiJson(responseMap);
  }
}
