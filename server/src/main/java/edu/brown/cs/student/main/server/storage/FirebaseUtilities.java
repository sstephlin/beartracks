package edu.brown.cs.student.main.server.storage;

import com.google.api.core.ApiFuture;
import com.google.api.core.ApiFutures;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.firestore.*;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.cloud.FirestoreClient;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
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
    CollectionReference collectionRef =
        db.collection("users").document(uid).collection(collection_id);
    collectionRef.document(doc_id).set(data);
  }

  // New recursive deletion logic
  public void deleteDocument(DocumentReference doc) {
    try {
      Iterable<CollectionReference> subcollections = doc.listCollections();
      List<ApiFuture<List<WriteResult>>> subDeletes = new ArrayList<>();

      for (CollectionReference subcol : subcollections) {
        subDeletes.add(deleteCollection(subcol));
      }

      // Wait for all subcollections to be deleted
      ApiFutures.allAsList(subDeletes).get();

      // Now delete the document itself
      doc.delete().get();

    } catch (Exception e) {
      System.err.println("Error deleting document and its subcollections: " + e.getMessage());
    }
  }

  // Recursively deletes all documents in a collection
  private ApiFuture<List<WriteResult>> deleteCollection(CollectionReference collection) {
    Firestore db = FirestoreClient.getFirestore();

    ApiFuture<QuerySnapshot> future = collection.get();
    return ApiFutures.transformAsync(
        future,
        querySnapshot -> {
          List<ApiFuture<WriteResult>> deletes = new ArrayList<>();
          for (QueryDocumentSnapshot docSnap : querySnapshot.getDocuments()) {
            deletes.add(deleteDocumentRecursive(docSnap.getReference()));
          }
          return ApiFutures.allAsList(deletes);
        },
        Runnable::run);
  }

  private ApiFuture<WriteResult> deleteDocumentRecursive(DocumentReference docRef) {
    Iterable<CollectionReference> subcollections = docRef.listCollections();
    List<ApiFuture<List<WriteResult>>> subDeletes = new ArrayList<>();

    for (CollectionReference subcolRef : subcollections) {
      subDeletes.add(deleteCollection(subcolRef));
    }

    return ApiFutures.transformAsync(
        ApiFutures.allAsList(subDeletes), (ignored) -> docRef.delete(), Runnable::run);
  }

  public Set<String> getAllUserCourses(String userId)
      throws ExecutionException, InterruptedException {

    Firestore db = FirestoreClient.getFirestore();
    CollectionReference semestersRef =
        db.collection("users").document(userId).collection("semesters");

    ApiFuture<QuerySnapshot> semestersFuture = semestersRef.get();
    List<QueryDocumentSnapshot> semesterDocs = semestersFuture.get().getDocuments();

    Set<String> allCourses = new HashSet<>();

    for (QueryDocumentSnapshot semesterDoc : semesterDocs) {
      if (!semesterDoc.exists()) {
        continue;
      }

      CollectionReference coursesRef = semesterDoc.getReference().collection("courses");
      ApiFuture<QuerySnapshot> coursesFuture = coursesRef.get();
      List<QueryDocumentSnapshot> courseDocs = coursesFuture.get().getDocuments();

      for (QueryDocumentSnapshot courseDoc : courseDocs) {
        if (courseDoc.exists()) {
          String courseCode = courseDoc.getString("code");
          if (courseCode != null) {
            allCourses.add(courseCode.toUpperCase());
          }
        }
      }
    }

    return allCourses;
  }

  @Override
  public Map<String, List<String>> getAllSemestersAndCourses(String uid)
      throws InterruptedException, ExecutionException, IllegalArgumentException {
    if (uid == null) {
      throw new IllegalArgumentException("getAllSemestersAndCourses: uid cannot be null");
    }

    Firestore db = FirestoreClient.getFirestore();
    Map<String, List<String>> semesterToCourses = new HashMap<>();

    CollectionReference semestersRef = db.collection("users").document(uid).collection("semesters");
    ApiFuture<QuerySnapshot> semestersFuture = semestersRef.get();
    List<QueryDocumentSnapshot> semesterDocs = semestersFuture.get().getDocuments();

    for (QueryDocumentSnapshot semesterDoc : semesterDocs) {
      String semesterKey = semesterDoc.getId();
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
    return null;
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

  @Override
  public String getCapstoneCourse(String uid) {
    try {
      Firestore db = FirestoreClient.getFirestore();
      CollectionReference semestersRef =
          db.collection("users").document(uid).collection("semesters");
      ApiFuture<QuerySnapshot> semestersFuture = semestersRef.get();
      List<QueryDocumentSnapshot> semesters = semestersFuture.get().getDocuments();

      for (QueryDocumentSnapshot semesterDoc : semesters) {
        CollectionReference coursesRef = semesterDoc.getReference().collection("courses");
        ApiFuture<QuerySnapshot> coursesFuture = coursesRef.get();
        List<QueryDocumentSnapshot> courseDocs = coursesFuture.get().getDocuments();

        for (QueryDocumentSnapshot courseDoc : courseDocs) {
          Boolean isCapstone = courseDoc.getBoolean("isCapstone");
          if (isCapstone != null && isCapstone) {
            return courseDoc.getId();
          }
        }
      }
    } catch (Exception e) {
      e.printStackTrace();
    }

    return null;
  }

  @Override
  public void updateDocument(
      DocumentReference ref,
      Map<String,Object> updates
  ) {
    // Firestore’s update() will merge these fields into the existing document
    ref.update(updates);
  }

  /**
   * updates the user's capstone course that stored in Firestore
   *
   * @param collectionPath - full path to the courses collection in firestore
   * @param docId - course code that we're looking to update
   * @param fieldName - "isCapstone" field in firestore, for each course documnent
   * @param newValue - either true or false
   */
  @Override
  public void updateIsCapstoneField(String collectionPath, String docId, String fieldName, Boolean newValue) {
    Firestore db = FirestoreClient.getFirestore();
    DocumentReference docRef = db.collection(collectionPath).document(docId);
    Map<String, Object> updates = new HashMap<>();
    updates.put(fieldName, newValue);
    docRef.set(updates, SetOptions.merge());
  }
}
