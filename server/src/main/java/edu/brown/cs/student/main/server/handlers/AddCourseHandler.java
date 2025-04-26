package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.HashMap;
import java.util.Map;
import spark.Request;
import spark.Response;
import spark.Route;

public class AddCourseHandler implements Route {
  public StorageInterface storageHandler;

  public AddCourseHandler(StorageInterface storageHandler) {
    this.storageHandler = storageHandler;
  }

  @Override
  public Object handle(Request request, Response response) throws Exception {
    Map<String, Object> responseMap = new HashMap<>();
    try {
      String uid = request.queryParams("uid");
      String courseCode = request.queryParams("code");
      String courseTitle = request.queryParams("title");
      String term = request.queryParams("term");
      String year = request.queryParams("year");

      if (uid == null || courseCode == null || term == null || year == null) {
        throw new IllegalArgumentException("Missing required query parameters");
      }

      String semesterKey = term + " " + year; // ex. "Fall 2021"

      Map<String, Object> courseData = new HashMap<>();
      courseData.put("code", courseCode);
      courseData.put("title", courseTitle);

      // Add document: users/{uid}/semesters/{semesterKey}/courses/{courseCode}
      // {} refers to document
      // otherwise collection
      storageHandler.addDocument(
          uid + "/semesters/" + semesterKey, "courses", courseCode, courseData);

      responseMap.put("response_type", "success");
      responseMap.put("message", "Course " + courseCode + " added to semester " + semesterKey);
    } catch (Exception e) {
      // error likely occurred in the storage handler
      e.printStackTrace();
      responseMap.put("response_type", "failure");
      responseMap.put("error", e.getMessage());
    }

    return Utils.toMoshiJson(responseMap);
  }
}
