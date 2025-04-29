package edu.brown.cs.student.main.server.storage;

import com.google.api.core.ApiFuture;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.CollectionReference;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

public class FirebaseUtilities implements StorageInterface {

  public FirebaseUtilities() throws IOException {
    String workingDirectory = System.getProperty("user.dir");
    Path firebaseConfigPath =
        Paths.get(workingDirectory, "src", "main", "resources", "firebase_config.json");

    FileInputStream serviceAccount = new FileInputStream(firebaseConfigPath.toString());

    FirebaseOptions options =
        new FirebaseOptions.Builder()
            .setCredentials(GoogleCredentials.fromStream(serviceAccount))
            .build();

    FirebaseApp.initializeApp(options);
  }

  @Override
  public void addDocument(String uid, String collection_id, String doc_id, Map<String, Object> data)
      throws IllegalArgumentException {
    if (uid == null || collection_id == null || doc_id == null || data == null) {
      throw new IllegalArgumentException(
          "addDocument: uid, collection_id, doc_id, or data cannot be null");
    }

    Firestore db = FirestoreClient.getFirestore();
    // 1: Get a ref to the collection that you created
    CollectionReference collectionRef =
        db.collection("users").document(uid).collection(collection_id);
    // 2: Write data to the collection ref
    collectionRef.document(doc_id).set(data);
  }

  public void deleteDocument(DocumentReference doc) {
    // for each subcollection, run deleteCollection()
    Iterable<CollectionReference> collections = doc.listCollections();
    for (CollectionReference collection : collections) {
      deleteCollection(collection);
    }
    // then delete the document
    doc.delete();
  }

  // recursively removes all the documents and collections inside a collection
  // https://firebase.google.com/docs/firestore/manage-data/delete-data#collections
  private void deleteCollection(CollectionReference collection) {
    try {

      // get all documents in the collection
      ApiFuture<QuerySnapshot> future = collection.get();
      List<QueryDocumentSnapshot> documents = future.get().getDocuments();

      // delete each document
      for (QueryDocumentSnapshot doc : documents) {
        doc.getReference().delete();
      }

      // NOTE: the query to documents may be arbitrarily large. A more robust
      // solution would involve batching the collection.get() call.
    } catch (Exception e) {
      System.err.println("Error deleting collection : " + e.getMessage());
    }
  }

  @Override
  public Map<String, List<String>> getAllSemestersAndCourses(String uid)
      throws InterruptedException, ExecutionException, IllegalArgumentException {
    if (uid == null) {
      throw new IllegalArgumentException("getAllSemestersAndCourses: uid cannot be null");
    }

    Firestore db = FirestoreClient.getFirestore();
    Map<String, List<String>> semesterToCourses = new HashMap<>();

    // Step 1: Get all semesters under users/{uid}/semesters/*
    CollectionReference semestersRef = db.collection("users").document(uid).collection("semesters");
    ApiFuture<QuerySnapshot> semestersFuture = semestersRef.get();
    List<QueryDocumentSnapshot> semesterDocs = semestersFuture.get().getDocuments();

    // Step 2: For each semester, get the 'courses' subcollection
    for (QueryDocumentSnapshot semesterDoc : semesterDocs) {
      String semesterKey = semesterDoc.getId(); // example: "Fall 2025"
      CollectionReference coursesRef = semesterDoc.getReference().collection("courses");
      ApiFuture<QuerySnapshot> coursesFuture = coursesRef.get();
      List<QueryDocumentSnapshot> courseDocs = coursesFuture.get().getDocuments();

      List<String> courseCodes = new ArrayList<>();
      for (QueryDocumentSnapshot courseDoc : courseDocs) {
        String courseCode = (String) courseDoc.get("code");
        if (courseCode != null) {
          courseCodes.add(courseCode);
        }
      }
      semesterToCourses.put(semesterKey, courseCodes);
    }

    return semesterToCourses;
  }

  @Override
  public String getView(String uid) throws Exception {
    DocumentReference docRef =
        FirestoreClient.getFirestore()
            .collection("users")
            .document(uid)
            .collection("view")
            .document("current");

    DocumentSnapshot snapshot = docRef.get().get();
    if (snapshot.exists() && snapshot.getString("view") != null) {
      return snapshot.getString("view");
    }
    return null; // frontend will default to "2"
  }

  @Override
  public String getConcentration(String uid) throws Exception {
    DocumentReference docRef =
        FirestoreClient.getFirestore()
            .collection("users")
            .document(uid)
            .collection("concentration")
            .document("current");

    DocumentSnapshot snapshot = docRef.get().get();
    if (snapshot.exists() && snapshot.getString("concentration") != null) {
      return snapshot.getString("concentration");
    }
    return null;
  }
}
