package edu.brown.cs.student.main.server;

import static spark.Spark.after;

import edu.brown.cs.student.main.server.handlers.AddCourseHandler;
import edu.brown.cs.student.main.server.handlers.AddSemesterHandler;
import edu.brown.cs.student.main.server.handlers.CheckSemesterHandler;
import edu.brown.cs.student.main.server.handlers.RemoveCourseHandler;
import edu.brown.cs.student.main.server.handlers.RemoveSemesterHandler;
import edu.brown.cs.student.main.server.handlers.SearchCourseHandler;
import edu.brown.cs.student.main.server.parser.CourseCSVParser;
import edu.brown.cs.student.main.server.parser.CourseCatalog;
import edu.brown.cs.student.main.server.storage.FirebaseUtilities;
import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.io.IOException;
import spark.Filter;
import spark.Spark;

public class Server {

  public static void setUpServer() {
    int port = 1234;
    Spark.port(port);

    after(
        (Filter)
            (request, response) -> {
              response.header("Access-Control-Allow-Origin", "*");
              response.header("Access-Control-Allow-Methods", "*");
            });

    StorageInterface firebaseUtils;
    try {
      // 1. Initialize Firebase
      firebaseUtils = new FirebaseUtilities();

      // 2. Parse CourseCatalog once at startup
      CourseCatalog catalog = CourseCSVParser.parse("data/mockCourse.csv");

      // 3. Set up routes
      Spark.get("add-course", new AddCourseHandler(firebaseUtils));
      Spark.get("add-semester", new AddSemesterHandler(firebaseUtils));
      Spark.get("remove-course", new RemoveCourseHandler(firebaseUtils));
      Spark.get("remove-semester", new RemoveSemesterHandler(firebaseUtils));
      Spark.get("check-semester", new CheckSemesterHandler(catalog));
      Spark.get("search-course", new SearchCourseHandler(catalog));

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
