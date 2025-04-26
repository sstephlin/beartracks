package edu.brown.cs.student.main.server.handlers;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.HashMap;
import java.util.Map;
import spark.Request;
import spark.Response;
import spark.Route;

public class RemoveSemesterHandler implements Route {
  public StorageInterface storageHandler;

  public RemoveSemesterHandler(StorageInterface storageHandler) {
    this.storageHandler = storageHandler;
  }

  @Override
  public Object handle(Request request, Response response) throws Exception {
    Map<String, Object> responseMap = new HashMap<>();
    try {
      String uid = request.queryParams("uid");
      String term = request.queryParams("term");
      String year = request.queryParams("year");

      if (uid == null || term == null || year == null) {
        throw new IllegalArgumentException("Missing required query parameters");
      }

      String semesterKey = term + " " + year; // ex. "Fall 2021"

      Firestore db = FirestoreClient.getFirestore();
      DocumentReference docRef =
          db.collection("users").document(uid).collection("semesters").document(semesterKey);

      // Call deleteDocument on that reference
      storageHandler.deleteDocument(docRef);

      responseMap.put("response_type", "success");
      responseMap.put("message", semesterKey + " removed for user " + uid);
    } catch (Exception e) {
      // error likely occurred in the storage handler
      e.printStackTrace();
      responseMap.put("response_type", "failure");
      responseMap.put("error", e.getMessage());
    }

    return Utils.toMoshiJson(responseMap);
  }
}
