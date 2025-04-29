package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import spark.Request;
import spark.Response;
import spark.Route;

public class AddSemesterHandler implements Route {
  private final StorageInterface storageHandler;

  public AddSemesterHandler(StorageInterface storageHandler) {
    this.storageHandler = storageHandler;
  }

  @Override
  public Object handle(Request request, Response response) throws Exception {
    Map<String, Object> responseMap = new HashMap<>();
    try {
      String uid = request.queryParams("uid");
      String term = request.queryParams("term");
      String year = request.queryParams("year");

      if (uid == null || term == null || year == null) {
        throw new IllegalArgumentException("Missing required query parameters");
      }

      String semesterKey = term + " " + year;

      // Create a semester document with a dummy field so that getAllUserCourses function can actually
      Map<String, Object> semesterData = new HashMap<>();
      semesterData.put("exists", true);

      storageHandler.addDocument(uid, "semesters", semesterKey, semesterData);

      responseMap.put("response_type", "success");
      responseMap.put("message", semesterKey + " added for user " + uid);
    } catch (Exception e) {
      e.printStackTrace();
      responseMap.put("response_type", "failure");
      responseMap.put("error", e.getMessage());
    }

    return Utils.toMoshiJson(responseMap);
  }
}
