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

      Map<String, List<String>> requirementOptions = new HashMap<>();
      // these names correspond to the names of the keys in the CSABDegreeRequirements or
      // CSScBDegreeRequirements requirements map
      List<String> requirementNames = List.of(
          "Intro Part 1", "Intro Part 2",
          "Foundations AI", "Foundations Systems", "Foundations Theory"
      );

      // for each requirement category, look up each prereq category key
      for (String req : requirementNames) {
        RequirementRule rule = requirements.get(req);
        if (rule != null) {
          requirementOptions.put(req, rule.getAcceptableCourses());
        }
      }

      // instantiate checker
      CSRequirementChecker checker =
          new CSRequirementChecker(this.storageHandler, uid, userCourses, requirements);
      Map<String, List<String>> requirementResults = checker.checkAllRequirements();

      int coursesCompleted = checker.countCoursesCompleted();
      int totalRequired = checker.getTotalCoursesRequired();

      responseMap.put("response_type", "success");
      responseMap.put("requirements_options", requirementOptions);
      responseMap.put("user_requirements_breakdown", requirementResults);
      responseMap.put("courses_completed", coursesCompleted);
      responseMap.put("total_required", totalRequired); // 10 for AB, 16 for ScB

    } catch (Exception e) {
      e.printStackTrace();
      responseMap.put("response_type", "failure");
      responseMap.put("error", e.getMessage());
    }

    return Utils.toMoshiJson(responseMap);
  }
}
