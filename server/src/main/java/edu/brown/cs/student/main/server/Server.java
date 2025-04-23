//package edu.brown.cs.student.main.server;
//
//import static spark.Spark.after;
//
//import edu.brown.cs.student.main.server.handlers.AddPinHandler;
//import edu.brown.cs.student.main.server.handlers.ClearUserPinsHandler;
//import edu.brown.cs.student.main.server.handlers.FindKeywordHandler;
//import edu.brown.cs.student.main.server.handlers.GetPinsHandler;
//import edu.brown.cs.student.main.server.handlers.RedliningHandler;
//import edu.brown.cs.student.main.server.parser.GeoJsonObject;
//import edu.brown.cs.student.main.server.parser.JSONParser2;
//import edu.brown.cs.student.main.server.storage.FirebaseUtilities;
//import edu.brown.cs.student.main.server.storage.StorageInterface;
//import java.io.IOException;
//import spark.Filter;
//import spark.Spark;
//
///** Top Level class for our project, utilizes spark to create and maintain our server. */
//public class Server {
//
//  public static void setUpServer() {
//    int port = 1234;
//    Spark.port(port);
//
//    after(
//        (Filter)
//            (request, response) -> {
//              response.header("Access-Control-Allow-Origin", "*");
//              response.header("Access-Control-Allow-Methods", "*");
//            });
//
//    StorageInterface firebaseUtils;
//    try {
//      firebaseUtils = new FirebaseUtilities();
//
//      //      Spark.get("add-word", new AddWordHandler(firebaseUtils));
//      //      Spark.get("list-words", new ListWordsHandler(firebaseUtils));
//      //      Spark.get("clear-user", new ClearUserHandler(firebaseUtils));
//
//      Spark.get("add-pin", new AddPinHandler(firebaseUtils));
//      Spark.get("get-pins", new GetPinsHandler(firebaseUtils));
//      Spark.get("clear-user-pins", new ClearUserPinsHandler(firebaseUtils));
//
//      // Register the redlining endpoint
//      JSONParser2 jsonParser = new JSONParser2();
//      jsonParser.createGeoJson();
//      GeoJsonObject parsedData = jsonParser.parsedJSON;
//
//      Spark.get("api-redlining", new RedliningHandler(parsedData));
//      Spark.get("find-keyword", new FindKeywordHandler(parsedData));
//
//      Spark.notFound(
//          (request, response) -> {
//            response.status(404); // Not Found
//            System.out.println("ERROR");
//            return "404 Not Found - The requested endpoint does not exist.";
//          });
//      Spark.init();
//      Spark.awaitInitialization();
//
//      System.out.println("Server started at http://localhost:" + port);
//    } catch (IOException e) {
//      e.printStackTrace();
//      System.err.println(
//          "Error: Could not initialize Firebase. Likely due to firebase_config.json not being found. Exiting.");
//      System.exit(1);
//    }
//  }
//
//  /**
//   * Runs Server.
//   *
//   * @param args none
//   */
//  public static void main(String[] args) {
//    setUpServer();
//  }
//}
