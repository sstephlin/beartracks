package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.parser.CourseCatalog;
import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
      String title = request.queryParams("title");
      String term = request.queryParams("term");
      String year = request.queryParams("year");

      if (uid == null || courseCode == null || term == null || year == null) {
        throw new IllegalArgumentException("Missing required query parameters");
      }

      String semesterKey = term + " " + year;

      // Ensure the semester document exists
      Map<String, Object> semesterData = new HashMap<>();
      semesterData.put("exists", true);
      storageHandler.addDocument(uid, "semesters", semesterKey, semesterData);

      // Get completed courses and check prerequisites
      Map<String, List<String>> semesterToCourses = storageHandler.getAllSemestersAndCourses(uid);
      //      Set<String> completedCourses =
      //          AddCourseHandlerHelper.getCompletedCourses(semesterToCourses, semesterKey);
      Map<String, String> courseToSemester = new HashMap<>();
      for (Map.Entry<String, List<String>> entry : semesterToCourses.entrySet()) {
        for (String c : entry.getValue()) {
          courseToSemester.put(c.toUpperCase(), entry.getKey());
        }
      }
      boolean prereqsMet =
          AddCourseHandlerHelper.checkPrerequisites(
              catalog, courseCode, semesterKey, courseToSemester);

      this.storageHandler.updatePrereqsMet(uid, semesterKey, courseCode, prereqsMet);

      String skip = request.queryParams("skipCheck");
      boolean skipCheck = skip != null && skip.equalsIgnoreCase("true");

      Map<String, Object> courseData = new HashMap<>();
      courseData.put("code", courseCode);
      courseData.put("title", title);
      courseData.put("prereqsMet", prereqsMet);
      courseData.put("isCapstone", false);

      storageHandler.addDocument(
          uid + "/semesters/" + semesterKey, "courses", courseCode, courseData);

      responseMap.put("response_type", "success");
      responseMap.put("message", "Course " + courseCode + " added to semester " + semesterKey);
      responseMap.put("prereqsMet", prereqsMet);
    } catch (Exception e) {
      e.printStackTrace();
      responseMap.put("response_type", "failure");
      responseMap.put("error", e.getMessage());
    }

    response.type("application/json");
    return Utils.toMoshiJson(responseMap);
  }
}
