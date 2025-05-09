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
import edu.brown.cs.student.main.server.handlers.GetUserCoursesHandler;
import edu.brown.cs.student.main.server.handlers.GetUserCoursesWithTitleHandler;
import edu.brown.cs.student.main.server.handlers.GetViewHandler;
import edu.brown.cs.student.main.server.handlers.RemoveCourseHandler;
import edu.brown.cs.student.main.server.handlers.RemoveSemesterHandler;
import edu.brown.cs.student.main.server.handlers.SearchCourseHandler;
import edu.brown.cs.student.main.server.handlers.StoreConcentrationHandler;
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
    int port = 3232;
    Spark.port(port);

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
          response.header(
              "Access-Control-Allow-Origin", "*"); // or restrict to "http://localhost:8000"
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
      Spark.get("get-user-courses", new GetUserCoursesHandler(firebaseUtils));
      Spark.get("get-user-courses-detailed", new GetUserCoursesWithTitleHandler(firebaseUtils));
      Spark.get(
          "check-concentration-requirements", new CheckUserRequirementsHandler(firebaseUtils));
      Spark.get("check-prereqs", new CheckPrereqsHandler(firebaseUtils, catalog));
      Spark.post("update-capstone", new UpdateCapstoneHandler(firebaseUtils));
      Spark.get("check-capstones", new CheckCapstoneHandler(firebaseUtils));
      Spark.get("get-concen-reqs", new GetConcentrationRequirementsHandler(firebaseUtils));

      Spark.notFound(
          (request, response) -> {
            response.status(404); // Not Found
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

  /**
   * Runs Server.
   *
   * @param args none
   */
  public static void main(String[] args) {
    setUpServer();
  }
}
