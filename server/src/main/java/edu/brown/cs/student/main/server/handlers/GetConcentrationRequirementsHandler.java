package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.googleSheetsRequirements.RequirementLoader;
import edu.brown.cs.student.main.server.googleSheetsRequirements.RequirementRow;
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
  private final String masterSheetId;
  private final String csAbTabGid;
  private final String csScbTabGid;

  public GetConcentrationRequirementsHandler(
      StorageInterface storageHandler,
      String masterSheetId,
      String csAbTabGid,
      String csScbTabGid) {
    this.storageHandler = storageHandler;
    this.masterSheetId = masterSheetId;
    this.csAbTabGid = csAbTabGid;
    this.csScbTabGid = csScbTabGid;
  }

  @Override
  public Object handle(Request request, Response response) throws Exception {
    Map<String, Object> responseMap = new HashMap<>();
    try {
      String uid = request.queryParams("uid");

      if (uid == null) {
        throw new IllegalArgumentException("Missing required query parameter: uid");
      }

      // Step 1: Get user concentration from storage
      String concentration = storageHandler.getConcentration(uid);
      if (concentration == null) {
        concentration = "Undeclared";
      }

      // If concentration is Undeclared, return an empty map
      if ("Undeclared".equals(concentration)) {
        responseMap.put("response_type", "success");
        responseMap.put("requirements_options", new LinkedHashMap<>());
        return Utils.toMoshiJson(responseMap);
      }

      // Step 2: Get Google Sheet ID from injected dependency
      if (this.masterSheetId == null || this.masterSheetId.isEmpty()) {
        throw new IllegalStateException("MASTER_GOOGLE_SHEET_ID environment variable not set.");
      }

      // Step 3: Determine the GID based on the concentration
      String tabGid;
      switch (concentration.trim().toUpperCase()) {
        case "COMPUTER SCIENCE A.B.":
          tabGid = this.csAbTabGid;
          break;
        case "COMPUTER SCIENCE SC.B.":
          tabGid = this.csScbTabGid;
          break;
        default:
          throw new IllegalArgumentException("Unsupported concentration: " + concentration);
      }

      if (tabGid == null || tabGid.isEmpty()) {
        throw new IllegalStateException(
            "Environment variable for " + concentration + " GID not set.");
      }

      // Step 4: Load requirements from Google Sheets
      Map<String, RequirementRow> requirements =
          RequirementLoader.loadRequirementRows(masterSheetId, tabGid);

      if (requirements.isEmpty()) {
        throw new IllegalStateException(
            "No requirements loaded for concentration: "
                + concentration
                + ". Check sheet ID and GID.");
      }

      // Step 5: Map internal category names to display names with their accepted courses
      Map<String, List<String>> requirementOptions = new LinkedHashMap<>();
      for (Map.Entry<String, RequirementRow> entry : requirements.entrySet()) {
        RequirementRow row = entry.getValue();
        // The display name is now the key, and the accepted courses are the value
        requirementOptions.put(row.getDisplayName(), row.getAcceptedCourses());
      }

      responseMap.put("response_type", "success");
      responseMap.put("requirements_options", requirementOptions);

    } catch (IllegalArgumentException e) {
      response.status(400); // Bad Request
      e.printStackTrace();
      responseMap.put("response_type", "failure");
      responseMap.put("error", e.getMessage());
    } catch (IllegalStateException e) {
      response.status(500); // Internal Server Error
      e.printStackTrace();
      responseMap.put("response_type", "failure");
      responseMap.put("error", "Server configuration error: " + e.getMessage());
    } catch (Exception e) {
      response.status(500); // Internal Server Error
      e.printStackTrace();
      responseMap.put("response_type", "failure");
      responseMap.put("error", "An unexpected error occurred: " + e.getMessage());
    }

    return Utils.toMoshiJson(responseMap);
  }
}
