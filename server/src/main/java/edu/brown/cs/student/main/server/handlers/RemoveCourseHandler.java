package edu.brown.cs.student.main.server.handlers;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import edu.brown.cs.student.main.server.parser.CourseCatalog;
import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import spark.Request;
import spark.Response;
import spark.Route;

public class RemoveCourseHandler implements Route {

  private final StorageInterface storageHandler;
  private final CourseCatalog catalog;

  public RemoveCourseHandler(StorageInterface storageHandler, CourseCatalog catalog) {
    this.storageHandler = storageHandler;
    this.catalog = catalog;
  }

  @Override
  public Object handle(Request request, Response response) throws Exception {
    Map<String, Object> responseMap = new HashMap<>();
    try {
      String uid = request.queryParams("uid");
      String courseCode = request.queryParams("code");
      String term = request.queryParams("term");
      String year = request.queryParams("year");
      if (uid == null || courseCode == null || term == null || year == null) {
        throw new IllegalArgumentException("Missing required query parameters");
      }
      String semesterKey = term + " " + year;

      // 1) Delete the dropped course
      Firestore db = FirestoreClient.getFirestore();
      DocumentReference toDelete =
          db.collection("users")
              .document(uid)
              .collection("semesters")
              .document(semesterKey)
              .collection("courses")
              .document(courseCode);
      storageHandler.deleteDocument(toDelete);

      // 2) Re-fetch the full map of semesters → course-codes
      Map<String, List<String>> allSemesters = storageHandler.getAllSemestersAndCourses(uid);
      System.out.println("all courses: " + storageHandler.getAllSemestersAndCourses(uid));
      // 3) For each remaining course, recompute prereqsMet and update it
      for (Map.Entry<String, List<String>> semEntry : allSemesters.entrySet()) {
        String sem = semEntry.getKey();
        List<String> codes = semEntry.getValue();

        // build the set of completed courses before this semester
        //        Set<String> completed = AddCourseHandlerHelper.getCompletedCourses(allSemesters,
        // sem);

        for (String code : codes) {
          Map<String, String> courseToSemester = new HashMap<>();
          for (Map.Entry<String, List<String>> entry : allSemesters.entrySet()) {
            for (String c : entry.getValue()) {
              courseToSemester.put(c.toUpperCase(), entry.getKey());
            }
          }

          boolean prereqsMet =
              AddCourseHandlerHelper.checkPrerequisites(catalog, code, sem, courseToSemester);

          //          // write it back to Firestore
          //          DocumentReference dref =
          //              db.collection("users")
          //                  .document(uid)
          //                  .collection("semesters")
          //                  .document(sem)
          //                  .collection("courses")
          //                  .document(code);
          //          // merge the single field
          //          dref.update("prereqsMet", met);
          this.storageHandler.updatePrereqsMet(uid, semesterKey, courseCode, prereqsMet);
        }
      }

      System.out.println("removed " + courseCode);
      responseMap.put("response_type", "success");
      responseMap.put("message", "Course " + courseCode + " removed; prerequisites re-evaluated.");
    } catch (Exception e) {
      e.printStackTrace();
      responseMap.put("response_type", "failure");
      responseMap.put("error", e.getMessage());
    }

    response.type("application/json");
    return Utils.toMoshiJson(responseMap);
  }
}
