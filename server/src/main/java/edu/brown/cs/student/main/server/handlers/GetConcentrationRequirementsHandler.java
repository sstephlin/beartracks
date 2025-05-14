package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.concentrationRequirements.*;
import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import spark.Request;
import spark.Response;
import spark.Route;

/** Gets course options for each requirement category for a user's selected concentration */
public class GetConcentrationRequirementsHandler implements Route {
  private final StorageInterface storageHandler;

  public GetConcentrationRequirementsHandler(StorageInterface storageHandler) {
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

      // Step 1: Get user concentration
      String concentration = storageHandler.getConcentration(uid);
      if (concentration == null) {
        concentration = "Undeclared";
      }

      Map<String, RequirementRule> requirements;

      if (concentration.equalsIgnoreCase("Computer Science A.B.")) {
        requirements = CSABDegreeRequirements.requirements;
      } else if (concentration.equalsIgnoreCase("Computer Science Sc.B.")) {
        requirements = CSScBDegreeRequirements.requirements;
      } else {
        throw new IllegalArgumentException("Unsupported concentration: " + concentration);
      }

      Map<String, List<String>> requirementOptions = new LinkedHashMap<>();

      // first, check if Calculus should be first (if concentration is Sc.B.)
      if (concentration.equalsIgnoreCase("Computer Science Sc.B.")) {
        RequirementRule calculusReq = requirements.get("Calculus");
        requirementOptions.put("Calculus", calculusReq.getAcceptableCourses());
      }

      // list of shared concentration requirements
      List<String> requirementNames =
          List.of(
              "Intro Part 1",
              "Intro Part 2",
              "Math Foundation",
              "Foundations AI",
              "Foundations Systems",
              "Foundations Theory");

      for (String req : requirementNames) {
        RequirementRule rule = requirements.get(req);
        if (rule != null) {
          requirementOptions.put(req, rule.getAcceptableCourses());
        }
      }

      if (concentration.equalsIgnoreCase("Computer Science A.B.")) {
        requirementOptions.put("2 Technical CSCI 1000-level courses", List.of());
        requirementOptions.put("2 Electives", List.of());
        requirementOptions.put("Capstone", List.of());
      } else if (concentration.equalsIgnoreCase("Computer Science Sc.B.")) {
        requirementOptions.put("5 Technical CSCI 1000-level courses", List.of());
        requirementOptions.put("4 Electives", List.of());
        requirementOptions.put("Capstone", List.of());
      }

      responseMap.put("response_type", "success");
      responseMap.put("requirements_options", requirementOptions);

    } catch (Exception e) {
      e.printStackTrace();
      responseMap.put("response_type", "failure");
      responseMap.put("error", e.getMessage());
    }

    return Utils.toMoshiJson(responseMap);
  }
}
