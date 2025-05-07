package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.concentrationRequirements.CSCapstoneCourses;
import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import spark.Request;
import spark.Response;
import spark.Route;

/** Returns a list of capstone-eligible courses that a user has added to their course plan */
public class CheckCapstoneHandler implements Route {

  private final StorageInterface storageHandler;

  public CheckCapstoneHandler(StorageInterface storageHandler) {
    this.storageHandler = storageHandler;
  }

  @Override
  public Object handle(Request request, Response response) throws Exception {
    Map<String, Object> responseMap = new HashMap<>();

    try {
      String uid = request.queryParams("uid");
      if (uid == null) {
        throw new IllegalArgumentException("Missing required query parameter: uid");
      }

      // 1. Get all courses from the user's course plan (e.g., ["CSCI 1300", "CSCI 1470", ...])
      Set<String> userCourses = storageHandler.getAllUserCourses(uid);
      List<String> capstoneMatches = new ArrayList<>();

      // 2. Check which courses are in the capstone list
      for (String course : userCourses) {
        if (CSCapstoneCourses.ALL.contains(course)
            || CSCapstoneCourses.AUTO_ACCEPTED.contains(course)) {
          capstoneMatches.add(course);
        }
      }

      responseMap.put("response_type", "success");
      responseMap.put("user_capstone_eligible_courses", capstoneMatches);

    } catch (Exception e) {
      e.printStackTrace();
      responseMap.put("response_type", "failure");
      responseMap.put("error", e.getMessage());
    }

    response.type("application/json");
    return Utils.toMoshiJson(responseMap);
  }
}
