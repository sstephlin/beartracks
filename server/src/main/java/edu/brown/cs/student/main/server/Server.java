package edu.brown.cs.student.main.server;

import static spark.Spark.before;
import static spark.Spark.options;

import edu.brown.cs.student.main.server.handlers.AddCourseHandler;
import edu.brown.cs.student.main.server.handlers.AddSemesterHandler;
import edu.brown.cs.student.main.server.handlers.CheckCapstoneHandler;
import edu.brown.cs.student.main.server.handlers.CheckPrereqsHandler;
import edu.brown.cs.student.main.server.handlers.CheckSemesterHandler;
import edu.brown.cs.student.main.server.handlers.CheckUserRequirementsHandler;
import edu.brown.cs.student.main.server.handlers.GetAllCourseAvailabilityHandler;
import edu.brown.cs.student.main.server.handlers.GetConcentrationHandler;
import edu.brown.cs.student.main.server.handlers.GetConcentrationRequirementsHandler;
import edu.brown.cs.student.main.server.handlers.GetExpandedHandler;
import edu.brown.cs.student.main.server.handlers.GetPrereqHandler;
import edu.brown.cs.student.main.server.handlers.GetUserCoursesHandler;
import edu.brown.cs.student.main.server.handlers.GetUserCoursesWithTitleHandler;
import edu.brown.cs.student.main.server.handlers.GetViewHandler;
import edu.brown.cs.student.main.server.handlers.RemoveCourseHandler;
import edu.brown.cs.student.main.server.handlers.RemoveSemesterHandler;
import edu.brown.cs.student.main.server.handlers.SearchCourseHandler;
import edu.brown.cs.student.main.server.handlers.StoreConcentrationHandler;
import edu.brown.cs.student.main.server.handlers.StoreSidebarHandler;
import edu.brown.cs.student.main.server.handlers.StoreViewHandler;
import edu.brown.cs.student.main.server.handlers.UpdateCapstoneHandler;
import edu.brown.cs.student.main.server.parser.CourseCSVParser;
import edu.brown.cs.student.main.server.parser.CourseCatalog;
import edu.brown.cs.student.main.server.storage.FirebaseUtilities;
import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.io.IOException;
import spark.Spark;

public class Server {

  public static void setUpServer() {
    // Render injects PORT, default to 3232 locally
    int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "3232"));
    Spark.port(port);

    // Fetch all required environment variables using Env helper
    String masterSheetId = Env.get("MASTER_GOOGLE_SHEET_ID");
    String csAbTabGid = Env.get("CS_AB_TAB_GID");
    String csScbTabGid = Env.get("CS_SCB_TAB_GID");
    String csAb27TabGid = Env.get("CS_AB_TAB_27_GID");
    String csScb27TabGid = Env.get("CS_SCB_TAB_27_GID");
    String apmaCSTabGid = Env.get("APMA_CS_TAB_GID");
    String mathCSTabGid = Env.get("MATH_CS_TAB_GID");
    String csEconScBTabGid = Env.get("CS_ECON_ScB_TAB_GID");
    String csEconABTabGid = Env.get("CS_ECON_AB_TAB_GID");

    // Enable CORS
    options(
        "/*",
        (request, response) -> {
          String accessControlRequestHeaders = request.headers("Access-Control-Request-Headers");
          if (accessControlRequestHeaders != null) {
            response.header("Access-Control-Allow-Headers", accessControlRequestHeaders);
          }

          String accessControlRequestMethod = request.headers("Access-Control-Request-Method");
          if (accessControlRequestMethod != null) {
            response.header("Access-Control-Allow-Methods", accessControlRequestMethod);
          }

          return "OK";
        });

    before(
        (request, response) -> {
          response.header("Access-Control-Allow-Origin", "*");
          response.header("Access-Control-Allow-Headers", "*");
          response.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        });

    StorageInterface firebaseUtils;
    try {
      // 1. Initialize Firebase
      firebaseUtils = new FirebaseUtilities();

      // 2. Parse CourseCatalog once at startup
      CourseCatalog catalog = CourseCSVParser.parse("data/clean_prereqs.csv");

      Spark.post("add-course", new AddCourseHandler(firebaseUtils, catalog));
      Spark.post("add-semester", new AddSemesterHandler(firebaseUtils));
      Spark.post("remove-course", new RemoveCourseHandler(firebaseUtils, catalog));
      Spark.post("remove-semester", new RemoveSemesterHandler(firebaseUtils));
      Spark.get("check-semester", new CheckSemesterHandler(catalog));
      Spark.get("get-all-course-availability", new GetAllCourseAvailabilityHandler(catalog));
      Spark.get("search-course", new SearchCourseHandler(catalog));
      Spark.post("store-concentration", new StoreConcentrationHandler(firebaseUtils));
      Spark.get("get-concentration", new GetConcentrationHandler(firebaseUtils));
      Spark.post("store-view", new StoreViewHandler(firebaseUtils));
      Spark.get("get-view", new GetViewHandler(firebaseUtils));
      Spark.post("store-expanded", new StoreSidebarHandler(firebaseUtils));
      Spark.get("get-expanded", new GetExpandedHandler(firebaseUtils));
      Spark.get("get-user-courses", new GetUserCoursesHandler(firebaseUtils));
      Spark.get("get-user-courses-detailed", new GetUserCoursesWithTitleHandler(firebaseUtils));
      Spark.get(
          "check-concentration-requirements",
          new CheckUserRequirementsHandler(
              firebaseUtils, masterSheetId, csAbTabGid, csScbTabGid, csAb27TabGid, csScb27TabGid));
      Spark.get(
          "get-concen-reqs",
          new GetConcentrationRequirementsHandler(
              firebaseUtils, masterSheetId, csAbTabGid, csScbTabGid, csAb27TabGid, csScb27TabGid));
      Spark.get("check-prereqs", new CheckPrereqsHandler(firebaseUtils, catalog));
      Spark.get("get-prereqs", new GetPrereqHandler(firebaseUtils, catalog));
      Spark.post("update-capstone", new UpdateCapstoneHandler(firebaseUtils));
      Spark.get(
          "check-capstones",
          new CheckCapstoneHandler(
              firebaseUtils,
              masterSheetId,
              csAbTabGid,
              csScbTabGid,
              csAb27TabGid,
              csScb27TabGid,
              apmaCSTabGid,
              mathCSTabGid,
              csEconScBTabGid,
              csEconABTabGid));

      Spark.notFound(
          (request, response) -> {
            response.status(404);
            System.out.println("ERROR");
            return "404 Not Found - The requested endpoint does not exist.";
          });
      Spark.init();
      Spark.awaitInitialization();

      System.out.println("Server started at http://localhost:" + port);
    } catch (IOException e) {
      e.printStackTrace();
      System.err.println(
          "Error: Could not initialize Firebase. Likely due to firebase_config.json not being found. Exiting.");
      System.exit(1);
    } catch (Exception e) {
      e.printStackTrace();
      System.err.println(
          "Error: Failed to parse Course CSV file. Check the file path or format. Exiting.");
      System.exit(1);
    }
  }

  public static void main(String[] args) {
    setUpServer();
  }
}
