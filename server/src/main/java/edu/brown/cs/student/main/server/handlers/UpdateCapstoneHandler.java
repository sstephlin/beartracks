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
      String courseCode =
          request.queryParams(
              "courseCode"); // is optional if user just wants to uncheck currrent captstoen course

      if (uid == null || term == null || year == null) {
        throw new IllegalArgumentException("Missing one or more required query parameters.");
      }

      String semester = term + " " + year;

      String previousCapstone = storageHandler.getCapstoneCourse(uid);

      // step 1. if there's a current capstone, uddate the isCapstone field to false
      if (previousCapstone != null) {
        String previousSemester = storageHandler.findSemesterOfCapstone(uid, previousCapstone);
        if (previousSemester != null) {
          storageHandler.updateIsCapstoneField(uid, previousSemester, previousCapstone, false);
        } else {
          System.out.println(
              "Could not locate semester for previous capstone: " + previousCapstone);
        }
      }

      // step 2 (not always applicable): if courseCode is NOT null, update new capstone course's
      // isCapstone field to true
      if (courseCode != null && !courseCode.trim().isEmpty()) {
        storageHandler.updateIsCapstoneField(uid, semester, courseCode.trim(), true);
        responseMap.put("response_type", "success");
        responseMap.put("message", "Capstone course is now updated to " + courseCode.trim());
      } else {
        responseMap.put("response_type", "success");
        responseMap.put("message", "Previous capstone unset (no new capstone course provided).");
      }

    } catch (Exception e) {
      e.printStackTrace();
      responseMap.put("response_type", "failure");
      responseMap.put("error", e.getMessage());
    }
    response.type("application/json");
    return Utils.toMoshiJson(responseMap);
  }
}
