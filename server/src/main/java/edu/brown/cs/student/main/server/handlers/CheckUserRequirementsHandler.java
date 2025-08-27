package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.googleSheetsRequirements.RequirementChecker;
import edu.brown.cs.student.main.server.googleSheetsRequirements.RequirementLoader;
import edu.brown.cs.student.main.server.googleSheetsRequirements.RequirementRow;
import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.io.IOException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import spark.Request;
import spark.Response;
import spark.Route;

// checks which courses satisfy each requirement of a user's concentration
public class CheckUserRequirementsHandler implements Route {
  private final StorageInterface storageHandler;
  private final String masterSheetId;
  private final String csAbTabGid;
  private final String csScbTabGid;
  private final String csAb27TabGid;
  private final String csScb27TabGid;

  /**
   * constructor for CheckUserRequirementsHandler
   *
   * @param storageHandler - contains all the methods connecting to firebase
   */
  public CheckUserRequirementsHandler(
      StorageInterface storageHandler,
      String masterSheetId,
      String csAbTabGid,
      String csScbTabGid,
      String csAb27TabGid,
      String csScb27TabGid) {
    this.storageHandler = storageHandler;
    this.masterSheetId = masterSheetId;
    this.csAbTabGid = csAbTabGid;
    this.csScbTabGid = csScbTabGid;
    this.csAb27TabGid = csAb27TabGid;
    this.csScb27TabGid = csScb27TabGid;
  }

  /**
   * Handles the check-concentration-requirements endpoint
   *
   * @param request - request object containing the query parameters
   * @param response - response object used to return success or error messages
   * @return A JSON response indicating success or failure.
   */
  @Override
  public Object handle(Request request, Response response) throws Exception {
    Map<String, Object> responseMap = new HashMap<>();
    try {
      String uid = request.queryParams("uid");

      if (uid == null) {
        throw new IllegalArgumentException("Missing required query parameter: uid");
      }

      // 1. Get user's concentration from Firebase first
      String concentration = storageHandler.getConcentration(uid);
      if (concentration == null || concentration.trim().isEmpty()) {
        concentration = "Undeclared";
      }

      // If concentration is Undeclared, return an empty map
      if ("Undeclared".equals(concentration)) {
        responseMap.put("response_type", "success");
        responseMap.put("concentration", concentration);
        responseMap.put("user_requirements_breakdown", new LinkedHashMap<>());
        responseMap.put("courses_completed", 0);
        responseMap.put("total_required", 0);
        return Utils.toMoshiJson(responseMap);
      }

      // 2. Get user's courses from Firebase using StorageInterface
      Set<String> userCourses = storageHandler.getAllUserCourses(uid);

      // 3. Get Google Sheet ID from injected dependency
      if (this.masterSheetId == null || this.masterSheetId.isEmpty()) {
        throw new IllegalStateException("MASTER_GOOGLE_SHEET_ID environment variable not set.");
      }

      // 4. Determine the GID based on the fetched concentration
      String tabGid;
      switch (concentration.trim().toUpperCase()) {
        case "COMPUTER SCIENCE A.B. 2028~":
          tabGid = this.csAbTabGid;
          break;
        case "COMPUTER SCIENCE SC.B. 2028~":
          tabGid = this.csScbTabGid;
          break;
        case "COMPUTER SCIENCE A.B. 2027":
          tabGid = this.csAb27TabGid;
          break;
        case "COMPUTER SCIENCE SC.B. 2027":
          tabGid = this.csScb27TabGid;
          break;
        default:
          throw new IllegalArgumentException(
              "Unsupported concentration: "
                  + concentration
                  + ". Please provide a valid concentration like 'Computer Science A.B.' or 'Computer Science Sc.B.'.");
      }

      if (tabGid == null || tabGid.isEmpty()) {
        throw new IllegalStateException(
            "Environment variable for " + concentration + " GID not set.");
      }

      // 5. Load requirements from Google Sheets using the master ID and specific tab GID
      Map<String, RequirementRow> requirements =
          RequirementLoader.loadRequirementRows(masterSheetId, tabGid);

      if (requirements.isEmpty()) {
        throw new IllegalStateException(
            "No requirements loaded for concentration: "
                + concentration
                + ". Check sheet ID and GID.");
      }

      // 6. Instantiate checker with dynamic requirements
      Set<String> userDesignatedCapstones = new HashSet<>(); // Or get from user input

      RequirementChecker checker =
          new RequirementChecker(requirements, userCourses, storageHandler, uid);

      // 7. Run checks
      Map<String, List<String>> internalRequirementResults = checker.checkAllRequirements();

      // Map internal category names to display names for the frontend
      Map<String, List<String>> displayRequirementResults = new LinkedHashMap<>();
      for (Map.Entry<String, List<String>> entry : internalRequirementResults.entrySet()) {
        String internalName = entry.getKey();
        List<String> courses = entry.getValue();

        RequirementRow row = requirements.get(internalName);
        if (row != null) {
          displayRequirementResults.put(row.getDisplayName(), courses);
        }
      }

      int coursesCompleted = checker.countCoursesCompleted(internalRequirementResults);
      int totalRequired = checker.getTotalCoursesRequired();

      responseMap.put("response_type", "success");
      responseMap.put("concentration", concentration);
      responseMap.put("user_requirements_breakdown", displayRequirementResults);
      responseMap.put("courses_completed", coursesCompleted);
      responseMap.put("total_required", totalRequired);

    } catch (IllegalArgumentException e) {
      // Catch specific argument errors and return a cleaner message
      responseMap.put("response_type", "failure");
      responseMap.put("error", e.getMessage());
      responseMap.put("courses_completed", 0);
      responseMap.put("total_required", 0);
      response.status(400); // Bad Request
    } catch (IllegalStateException e) {
      // Catch errors related to missing environment variables or sheet loading
      responseMap.put("response_type", "failure");
      responseMap.put("error", "Server configuration error: " + e.getMessage());
      responseMap.put("courses_completed", 0);
      responseMap.put("total_required", 0);
      response.status(500); // Internal Server Error
    } catch (IOException e) {
      // Catch network/file I/O errors
      responseMap.put("response_type", "failure");
      responseMap.put("error", "Failed to access Google Sheet: " + e.getMessage());
      responseMap.put("courses_completed", 0);
      responseMap.put("total_required", 0);
      response.status(500); // Internal Server Error
    } catch (Exception e) {
      e.printStackTrace(); // Log the full stack trace for debugging
      responseMap.put("response_type", "failure");
      responseMap.put("error", "An unexpected error occurred: " + e.getMessage());
      responseMap.put("courses_completed", 0); // Default to 0 on error
      responseMap.put("total_required", 0); // Default to 0 on error
      response.status(500); // Internal Server Error
    }

    return Utils.toMoshiJson(responseMap);
  }
}
