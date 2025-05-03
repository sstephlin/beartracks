//package edu.brown.cs.student.main.server.handlers;
//
//import edu.brown.cs.student.main.server.parser.CourseCatalog;
//import edu.brown.cs.student.main.server.storage.StorageInterface;
//import java.util.HashMap;
//import java.util.List;
//import java.util.Map;
//import spark.Request;
//import spark.Response;
//import spark.Route;
//
//public class CheckPrereqsHandler implements Route {
//  private final StorageInterface storageHandler;
//  private final CourseCatalog catalog;
//
//  public CheckPrereqsHandler(StorageInterface storageHandler, CourseCatalog catalog) {
//    this.storageHandler = storageHandler;
//    this.catalog = catalog;
//  }
//
//  //  @Override
//  //  public Object handle(Request request, Response response) throws Exception {
//  //    String uid = request.queryParams("uid");
//  //    String courseCode = request.queryParams("code");
//  //    String term = request.queryParams("term");
//  //    String year = request.queryParams("year");
//  //    String semesterKey = term + " " + year;
//  //
//  //    // Build completed courses set for this user up to *before* semesterKey
//  //    Map<String, List<String>> semMap = storageHandler.getAllSemestersAndCourses(uid);
//  //    System.out.println("semMap" + semMap);
//  //    Set<String> completed =
//  //        AddCourseHandlerHelper.getCompletedCourses(
//  //            semMap, semesterKey);
//  //    System.out.println("completed:" + completed);
//  //    Map<String, String> courseToSemester = new HashMap<>();
//  //    for (Map.Entry<String, List<String>> entry : semMap.entrySet()) {
//  //      for (String c : entry.getValue()) {
//  //        courseToSemester.put(c.toUpperCase(), entry.getKey());
//  //      }
//  //    }
//  //    boolean met =
//  //        AddCourseHandlerHelper.checkPrerequisites(
//  //            catalog, courseCode, completed, semesterKey, courseToSemester);
//  //
//  //    Map<String, Object> out = new HashMap<>();
//  //    out.put("response_type", "success");
//  //    out.put("prereqsMet", met); // NEW
//  //    response.type("application/json");
//  //    return Utils.toMoshiJson(out);
//  //  }
//  @Override
//  public Object handle(Request request, Response response) throws Exception {
//    String uid = request.queryParams("uid");
//    String courseCode = request.queryParams("code");
//    String term = request.queryParams("term");
//    String year = request.queryParams("year");
//    String semesterKey = term + " " + year;
//
//    Map<String, List<String>> semMap = storageHandler.getAllSemestersAndCourses(uid);
//    Map<String, String> courseToSemester = new HashMap<>();
//    for (Map.Entry<String, List<String>> entry : semMap.entrySet()) {
//      for (String c : entry.getValue()) {
//        courseToSemester.put(c.toUpperCase(), entry.getKey());
//      }
//    }
//    boolean met =
//        AddCourseHandlerHelper.checkPrerequisites(
//            catalog, courseCode, semesterKey, courseToSemester);
//
//    Map<String, Object> out = new HashMap<>();
//    out.put("response_type", "success");
//    out.put("prereqsMet", met);
//    response.type("application/json");
//    return Utils.toMoshiJson(out);
//  }
//}

package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.parser.CourseCatalog;
import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import spark.Request;
import spark.Response;
import spark.Route;

public class CheckPrereqsHandler implements Route {
  private final StorageInterface storageHandler;
  private final CourseCatalog catalog;

  public CheckPrereqsHandler(StorageInterface storageHandler, CourseCatalog catalog) {
    this.storageHandler = storageHandler;
    this.catalog = catalog;
  }

  //  @Override
  //  public Object handle(Request request, Response response) throws Exception {
  //    String uid = request.queryParams("uid");
  //    String courseCode = request.queryParams("code");
  //    String term = request.queryParams("term");
  //    String year = request.queryParams("year");
  //    String semesterKey = term + " " + year;
  //
  //    // Build completed courses set for this user up to *before* semesterKey
  //    Map<String, List<String>> semMap = storageHandler.getAllSemestersAndCourses(uid);
  //    System.out.println("semMap" + semMap);
  //    Set<String> completed =
  //        AddCourseHandlerHelper.getCompletedCourses(
  //            semMap, semesterKey);
  //    System.out.println("completed:" + completed);
  //    Map<String, String> courseToSemester = new HashMap<>();
  //    for (Map.Entry<String, List<String>> entry : semMap.entrySet()) {
  //      for (String c : entry.getValue()) {
  //        courseToSemester.put(c.toUpperCase(), entry.getKey());
  //      }
  //    }
  //    boolean met =
  //        AddCourseHandlerHelper.checkPrerequisites(
  //            catalog, courseCode, completed, semesterKey, courseToSemester);
  //
  //    Map<String, Object> out = new HashMap<>();
  //    out.put("response_type", "success");
  //    out.put("prereqsMet", met); // NEW
  //    response.type("application/json");
  //    return Utils.toMoshiJson(out);
  //  }
  @Override
  public Object handle(Request request, Response response) throws Exception {
    String uid = request.queryParams("uid");
    String courseCode = request.queryParams("code");
    String term = request.queryParams("term");
    String year = request.queryParams("year");
    String semesterKey = term + " " + year;

    Map<String, List<String>> semMap = storageHandler.getAllSemestersAndCourses(uid);
    Map<String, String> courseToSemester = new HashMap<>();
    for (Map.Entry<String, List<String>> entry : semMap.entrySet()) {
      for (String c : entry.getValue()) {
        courseToSemester.put(c.toUpperCase(), entry.getKey());
      }
    }

    boolean prereqsMet =
        AddCourseHandlerHelper.checkPrerequisites(
            catalog, courseCode, semesterKey, courseToSemester);
    this.storageHandler.updatePrereqsMet(uid, semesterKey, courseCode, prereqsMet);

    Map<String, Object> out = new HashMap<>();
    out.put("response_type", "success");
    out.put("prereqsMet", prereqsMet);
    response.type("application/json");
    return Utils.toMoshiJson(out);
  }
}