package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.concentrationRequirements.*;
import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import spark.Request;
import spark.Response;
import spark.Route;

// checks which courses satisfy each requirement of a user's concentration
public class CheckUserRequirementsHandler implements Route {
  public StorageInterface storageHandler;

  /**
   * constructor for CheckUserRequirementsHandler
   *
   * @param storageHandler - contains all the methods connecting to firebase
   */
  public CheckUserRequirementsHandler(StorageInterface storageHandler) {
    this.storageHandler = storageHandler;
  }

  /**
   * Handles the check-concentration-requirements endpoint
   *
   * @param request - request object containing the query parameters
   * @param response - response object used to return success or error messages
   * @return A JSON response indicating success or failure.
   */
  public Object handle(Request request, Response response) throws Exception {
    Map<String, Object> responseMap = new HashMap<>();
    try {
      String uid = request.queryParams("uid");

      if (uid == null) {
        throw new IllegalArgumentException("Missing required query parameter: uid");
      }

      // Step 1: Get user concentration
      String concentration = storageHandler.getConcentration(uid);
      if (concentration == null) {
        concentration = "Undeclared"; // Default
      }

      // Step 2: Get all user courses
      Set<String> userCourses = storageHandler.getAllUserCourses(uid);

      // Step 3: instantiate checker that checks user's courses WITH concentration requirements
      CSRequirementChecker checker =
          new CSRequirementChecker(this.storageHandler, uid, userCourses, concentration);
      Map<String, List<String>> requirementResults = new HashMap<>();
      int coursesCompleted = -1;
      int totalRequired = checker.getTotalCoursesRequired();

      try {
        requirementResults = checker.checkAllRequirements();
        coursesCompleted = checker.countCoursesCompleted(requirementResults);

      } catch (IllegalArgumentException e) {
        if ("No courses found for user.".equals(e.getMessage())) {
          coursesCompleted = 0;
          responseMap.put("courses_completed", coursesCompleted);
        }
      }
      responseMap.put("response_type", "success");
      responseMap.put("concentration", concentration);
      responseMap.put("user_requirements_breakdown", requirementResults);
      responseMap.put("courses_completed", coursesCompleted);
      responseMap.put("total_required", totalRequired); // 10 for AB, 16 for ScB

    } catch (Exception e) {
      e.printStackTrace();
      responseMap.put("response_type", "failure");
      responseMap.put("error", e.getMessage());
      responseMap.put("courses_completed", 0);
    }

    return Utils.toMoshiJson(responseMap);
  }
}
