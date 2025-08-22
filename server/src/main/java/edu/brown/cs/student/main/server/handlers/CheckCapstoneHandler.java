package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.googleSheetsRequirements.RequirementLoader;
import edu.brown.cs.student.main.server.googleSheetsRequirements.RequirementRow;
import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import spark.Request;
import spark.Response;
import spark.Route;

/**
 * Returns a list of all capstone-eligible courses for a user's concentration
 *
 * <p>NOTE: This has been modified to return all eligible courses, not just those the user has
 * taken. The front-end is responsible for handling the display.
 */
public class CheckCapstoneHandler implements Route {

  private final StorageInterface storageHandler;
  private final String masterSheetId;
  private final Map<String, String> concentrationGids;

  public CheckCapstoneHandler(
      StorageInterface storageHandler,
      String masterSheetId,
      String csAbTabGid,
      String csScbTabGid,
      String csAb27TabGid,
      String csScb27TabGid,
      String apmaCSTabGid,
      String mathCSTabGid,
      String csEconScBTabGid,
      String csEconABTabGid) {
    this.storageHandler = storageHandler;
    this.masterSheetId = masterSheetId;

    this.concentrationGids = new HashMap<>();
    this.concentrationGids.put("Computer Science A.B. 2028~", csAbTabGid);
    this.concentrationGids.put("Computer Science Sc.B. 2028~", csScbTabGid);
    this.concentrationGids.put("Computer Science A.B. 2027", csAb27TabGid);
    this.concentrationGids.put("Computer Science Sc.B. 2027", csScb27TabGid);
    this.concentrationGids.put("Applied Mathematics-Computer Science A.B.", apmaCSTabGid);
    this.concentrationGids.put("Mathematics-Computer Science A.B.", mathCSTabGid);
    this.concentrationGids.put("Computer Science-Economics Sc.B.", csEconScBTabGid);
    this.concentrationGids.put("Computer Science-Economics A.B.", csEconABTabGid);
  }

  @Override
  public Object handle(Request request, Response response) throws Exception {
    Map<String, Object> responseMap = new HashMap<>();
    try {
      String uid = request.queryParams("uid");
      String concentration = request.queryParams("concentration");

      if (uid == null) {
        throw new IllegalArgumentException("Missing required query parameter: uid");
      }
      if (concentration == null) {
        throw new IllegalArgumentException("Missing required query parameter: concentration");
      }

      // Get the full list of capstone courses from the Google Sheet
      List<String> allCapstoneCourses = getCapstoneCoursesFromSheet(concentration);

      // Get the user's currently selected capstone course from Firebase
      String currentCapstoneCourse = storageHandler.getCapstoneCourse(uid);

      // Return the full list and the user's selected course
      responseMap.put("response_type", "success");
      responseMap.put("user_capstone_eligible_courses", allCapstoneCourses);
      responseMap.put("current_capstone_course", currentCapstoneCourse);

    } catch (IllegalArgumentException e) {
      responseMap.put("response_type", "failure");
      responseMap.put("error", e.getMessage());
      response.status(400); // Bad Request
    } catch (IllegalStateException e) {
      responseMap.put("response_type", "failure");
      responseMap.put("error", "Server configuration error: " + e.getMessage());
      response.status(500); // Internal Server Error
    } catch (Exception e) {
      e.printStackTrace();
      responseMap.put("response_type", "failure");
      responseMap.put("error", "An unexpected error occurred: " + e.getMessage());
      response.status(500); // Internal Server Error
    }

    return Utils.toMoshiJson(responseMap);
  }

  /**
   * Retrieves all capstone-eligible courses from the Google Sheet for a given concentration.
   *
   * @param concentration The user's concentration
   * @return A list of all courses eligible for the capstone requirement.
   * @throws Exception if there's an error reading from the sheet
   */
  private List<String> getCapstoneCoursesFromSheet(String concentration) throws Exception {
    // Validate sheet ID
    if (masterSheetId == null || masterSheetId.isEmpty()) {
      throw new IllegalStateException("Master Google Sheet ID not provided");
    }

    // Get the GID for this concentration
    String gid = concentrationGids.get(concentration);
    if (gid == null) {
      throw new IllegalArgumentException("Unsupported concentration: " + concentration);
    }

    if (gid.isEmpty()) {
      throw new IllegalStateException("GID not provided for concentration: " + concentration);
    }

    try {
      // Load requirements from Google Sheet
      Map<String, RequirementRow> requirements =
          RequirementLoader.loadRequirementRows(masterSheetId, gid);

      // Find the Capstone row
      RequirementRow capstoneRow = requirements.get("Capstone");
      if (capstoneRow == null) {
        System.err.println(
            "Warning: No 'Capstone' category found in requirements for concentration: "
                + concentration);
        return new ArrayList<>();
      }

      // Return the accepted courses list from the Capstone row
      return capstoneRow.getAcceptedCourses();

    } catch (Exception e) {
      System.err.println("Error loading capstone courses from Google Sheet: " + e.getMessage());
      // Fall back to empty list or you could fall back to the static class as a backup
      return new ArrayList<>();
    }
  }
}
