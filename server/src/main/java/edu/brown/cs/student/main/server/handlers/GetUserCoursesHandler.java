package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import spark.Request;
import spark.Response;
import spark.Route;

public class GetUserCoursesHandler implements Route {
  private final StorageInterface storageHandler;

  public GetUserCoursesHandler(StorageInterface storageHandler) {
    this.storageHandler = storageHandler;
  }

  @Override
  public Object handle(Request request, Response response) throws Exception {
    Map<String, Object> responseMap = new HashMap<>();
    try {
      String uid = request.queryParams("uid");
      if (uid == null) {
        throw new IllegalArgumentException("Missing uid parameter");
      }

      // Step 1: Load all semesters and their courses
      Map<String, List<String>> semesterToCourses = storageHandler.getAllSemestersAndCourses(uid);

      responseMap.put("response_type", "success");
      responseMap.put("semesters", semesterToCourses);

    } catch (Exception e) {
      e.printStackTrace();
      responseMap.put("response_type", "failure");
      responseMap.put("error", e.getMessage());
    }

    return Utils.toMoshiJson(responseMap);
  }
}
