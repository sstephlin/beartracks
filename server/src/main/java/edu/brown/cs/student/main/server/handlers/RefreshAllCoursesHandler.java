package edu.brown.cs.student.main.server.handlers;

import com.google.gson.*;
import edu.brown.cs.student.main.server.parser.CourseCatalog;
import java.util.*;
import spark.Request;
import spark.Response;
import spark.Route;

public class RefreshAllCoursesHandler implements Route {

  private final CourseCatalog catalog;

  public RefreshAllCoursesHandler(CourseCatalog catalog) {
    this.catalog = catalog;
  }

  @Override
  public Object handle(Request request, Response response) throws Exception {
    Gson gson = new Gson();
    JsonObject body = gson.fromJson(request.body(), JsonObject.class);

    // Parse input
    JsonObject semesterMapJson = body.getAsJsonObject("semesterMap");
    String currentSemester = body.get("currentSemester").getAsString();

    // Build structures
    Map<String, List<String>> semesterToCourseCodes = new HashMap<>();
    Map<String, String> idToSemester = new HashMap<>();
    Map<String, String> idToCourseCode = new HashMap<>();
    Map<String, String> courseToSemester = new HashMap<>();

    for (Map.Entry<String, JsonElement> entry : semesterMapJson.entrySet()) {
      String semester = entry.getKey();
      JsonArray courseArray = entry.getValue().getAsJsonArray();
      List<String> courseCodes = new ArrayList<>();

      for (JsonElement courseEl : courseArray) {
        JsonObject courseObj = courseEl.getAsJsonObject();
        String courseCode = courseObj.get("courseCode").getAsString().toUpperCase();
        String id = courseObj.get("id").getAsString();

        courseCodes.add(courseCode);
        idToSemester.put(id, semester);
        idToCourseCode.put(id, courseCode);
        courseToSemester.put(courseCode, semester); // map course to semester for recursive checking
      }

      semesterToCourseCodes.put(semester, courseCodes);
    }

    // Compute completed courses (prior to current semester)
    Set<String> completed =
        AddCourseHandlerHelper.getCompletedCourses(semesterToCourseCodes, currentSemester);

    // Evaluate each course
    List<Map<String, Object>> prereqResults = new ArrayList<>();
    for (String id : idToCourseCode.keySet()) {
      String semester = idToSemester.get(id);
      String code = idToCourseCode.get(id);

      boolean met =
          AddCourseHandlerHelper.checkPrerequisites(
              catalog, code, completed, semester, courseToSemester);

      prereqResults.add(Map.of("id", id, "prereqMet", met));
    }

    return gson.toJson(prereqResults);
  }
}
