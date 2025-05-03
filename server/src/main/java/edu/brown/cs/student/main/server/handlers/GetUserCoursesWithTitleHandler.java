// 📄 GetUserCoursesWithTitleHandler.java
package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import spark.Request;
import spark.Response;
import spark.Route;

/**
 * similar to getusercourses but also includes title. used for keeping the data on screen on reload,
 * now extended to include prereqMet and isCapstone.
 */
public class GetUserCoursesWithTitleHandler implements Route {
  private final StorageInterface storageHandler;

  public GetUserCoursesWithTitleHandler(StorageInterface storageHandler) {
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

      Map<String, List<Map<String, Object>>> semesterToCourses =
          storageHandler.getAllSemestersAndCourses(
              uid, true); // assuming this is implemented correctly

      for (List<Map<String, Object>> courseList : semesterToCourses.values()) {
        for (Map<String, Object> course : courseList) {
          if (!course.containsKey("prereqsMet")) {
            course.put("prereqsMet", course.get("prereqsMet"));
          }
          if (!course.containsKey("isCapstone")) {
            course.put("isCapstone", course.get("isCapstone"));
          }
        }
      }
      responseMap.put("response_type", "success");
      responseMap.put("semesters", semesterToCourses);
    } catch (Exception e) {
      e.printStackTrace();
      responseMap.put("response_type", "failure");
      responseMap.put("error", e.getMessage());
    }

    response.type("application/json");
    return Utils.toMoshiJson(responseMap);
  }
}
