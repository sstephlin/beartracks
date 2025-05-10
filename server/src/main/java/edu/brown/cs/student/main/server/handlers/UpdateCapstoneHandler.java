package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.HashMap;
import java.util.Map;
import spark.Request;
import spark.Response;
import spark.Route;

public class UpdateCapstoneHandler implements Route {
  private final StorageInterface storageHandler;

  public UpdateCapstoneHandler(StorageInterface storageHandler) {
    this.storageHandler = storageHandler;
  }

  @Override
  public Object handle(Request request, Response response) throws Exception {
    Map<String, Object> responseMap = new HashMap<>();

    try {
      String uid = request.queryParams("uid");
      String term = request.queryParams("term");
      String year = request.queryParams("year");
      String courseCode = request.queryParams("courseCode"); // e.g. "CSCI 1470"

      String semester = term + " " + year;

      if (uid == null || semester == null || courseCode == null) {
        throw new IllegalArgumentException("Missing one or more required query parameters.");
      }

      // 1. Find old capstone if it exists and set isCapstone field to false
      String previousCapstone = storageHandler.getCapstoneCourse(uid);

      if (previousCapstone != null && !previousCapstone.equals(courseCode)) {
        String previousSemester = storageHandler.findSemesterOfCapstone(uid, previousCapstone);
        if (previousSemester != null) {
          storageHandler.updateIsCapstoneField(uid, previousSemester, previousCapstone, false);
        } else {
          System.out.println("Failed to find semester for previous capstone: " + previousCapstone);
        }
      }

      // 2. Mark new course as capstone
      storageHandler.updateIsCapstoneField(uid, semester, courseCode, true);

      responseMap.put("response_type", "success");
      responseMap.put("message", "Capstone course updated to " + courseCode);
    } catch (Exception e) {
      e.printStackTrace();
      responseMap.put("response_type", "failure");
      responseMap.put("error", e.getMessage());
    }

    response.type("application/json");
    return Utils.toMoshiJson(responseMap);
  }
}
