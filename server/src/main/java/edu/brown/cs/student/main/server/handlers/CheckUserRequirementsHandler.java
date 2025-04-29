package edu.brown.cs.student.main.server.handlers;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import spark.Request;
import spark.Response;
import spark.Route;

import edu.brown.cs.student.main.server.concentrationRequirements.*;
import edu.brown.cs.student.main.server.storage.StorageInterface;

import java.util.Map;

public class CheckUserRequirementsHandler implements Route {
  public StorageInterface storageHandler;

  public CheckUserRequirementsHandler(StorageInterface storageHandler) {
    this.storageHandler = storageHandler;
  }

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
      if (userCourses == null || userCourses.isEmpty()) {
        throw new IllegalArgumentException("No courses found for user.");
      }

      // Step 3: Pick the correct requirement rules
      Map<String, RequirementRule> requirements;
      if (concentration.equalsIgnoreCase("Computer Science AB")) {
        requirements = CSABDegreeRequirements.requirements;
      } else if (concentration.equalsIgnoreCase("Computer Science ScB")) {
        requirements = CSScBDegreeRequirements.requirements;
      } else {
        throw new IllegalArgumentException("Unsupported concentration: " + concentration);
      }

      RequirementChecker checker = new RequirementChecker(userCourses, requirements);
      Map<String, List<String>> requirementsStatus = checker.checkAllRequirements();

      responseMap.put("response_type", "success");
      responseMap.put("requirements_status", requirementsStatus);
    } catch (Exception e) {
      e.printStackTrace();
      responseMap.put("response_type", "failure");
      responseMap.put("error", e.getMessage());
    }

    return Utils.toMoshiJson(responseMap);
  }
}
