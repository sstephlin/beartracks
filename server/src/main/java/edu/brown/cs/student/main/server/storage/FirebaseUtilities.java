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

  private final Firestore db;

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
    this.db = FirestoreClient.getFirestore();
  }

  @Override
  public void addDocument(String uid, String collection_id, String doc_id, Map<String, Object> data)
      throws IllegalArgumentException {
    if (uid == null || collection_id == null || doc_id == null || data == null) {
      throw new IllegalArgumentException(
          "addDocument: uid, collection_id, doc_id, or data cannot be null");
    }

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
  public Map<String, List<Map<String, Object>>> getAllSemestersAndCourses(
      String uid, boolean includeTitle) throws Exception {
    Map<String, List<Map<String, Object>>> result = new HashMap<>();

    CollectionReference semestersRef = db.collection("users").document(uid).collection("semesters");
    ApiFuture<QuerySnapshot> semestersSnapshot = semestersRef.get();

    for (DocumentSnapshot semesterDoc : semestersSnapshot.get().getDocuments()) {
      String semester = semesterDoc.getId();
      List<Map<String, Object>> courseList = new ArrayList<>();

      CollectionReference coursesRef = semestersRef.document(semester).collection("courses");
      List<QueryDocumentSnapshot> courses = coursesRef.get().get().getDocuments();

      for (QueryDocumentSnapshot courseDoc : courses) {
        Map<String, Object> courseMap = new HashMap<>();
        courseMap.put("courseCode", courseDoc.getId()); // course code as doc ID

        if (includeTitle) {
          courseMap.put("title", courseDoc.getString("title"));
          courseMap.put(
              "prereqsMet",
              courseDoc.getBoolean("prereqsMet") != null
                  ? courseDoc.getBoolean("prereqsMet")
                  : false);
          courseMap.put(
              "isCapstone",
              courseDoc.getBoolean("isCapstone") != null
                  ? courseDoc.getBoolean("isCapstone")
                  : false);
        }
        courseList.add(courseMap);
      }
      result.put(semester, courseList);
    }
    return result;
  }

  @Override
  public Map<String, List<String>> getAllSemestersAndCourses(String uid) throws Exception {
    Map<String, List<String>> result = new HashMap<>();

    CollectionReference semestersRef = db.collection("users").document(uid).collection("semesters");

    List<QueryDocumentSnapshot> semesterDocs = semestersRef.get().get().getDocuments();

    for (QueryDocumentSnapshot semesterDoc : semesterDocs) {
      String semester = semesterDoc.getId();
      List<String> courseCodes = new ArrayList<>();

      CollectionReference coursesRef = semesterDoc.getReference().collection("courses");
      List<QueryDocumentSnapshot> courseDocs = coursesRef.get().get().getDocuments();

      for (QueryDocumentSnapshot courseDoc : courseDocs) {
        courseCodes.add(courseDoc.getId()); // assume courseCode is stored as document ID
      }

      result.put(semester, courseCodes);
    }

    return result;
  }

  @Override
  public String getView(String uid) throws Exception {
    DocumentReference docRef =
        db.collection("users").document(uid).collection("view").document("current");

    DocumentSnapshot snapshot = docRef.get().get();
    if (snapshot.exists() && snapshot.getString("view") != null) {
      return snapshot.getString("view");
    }
    return null;
  }

  @Override
  public String getExpanded(String uid) throws Exception {
    DocumentReference docRef =
        db.collection("users").document(uid).collection("expanded").document("current");

    DocumentSnapshot snapshot = docRef.get().get();
    if (snapshot.exists() && snapshot.getString("expanded") != null) {
      return snapshot.getString("expanded");
    }
    return null;
  }

  @Override
  public String getConcentration(String uid) throws Exception {
    DocumentReference docRef =
        db.collection("users").document(uid).collection("concentration").document("current");

    DocumentSnapshot snapshot = docRef.get().get();
    if (snapshot.exists() && snapshot.getString("concentration") != null) {
      return snapshot.getString("concentration");
    }
    return null;
  }

  @Override
  public String getCapstoneCourse(String uid) {
    try {
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
  public void updatePrereqsMet(String uid, String semester, String courseCode, boolean prereqsMet) {

    if (uid == null || semester == null || courseCode == null) {
      throw new IllegalArgumentException("uid, semester, and courseCode must be non-null.");
    }

    DocumentReference docRef =
        db.collection("users")
            .document(uid)
            .collection("semesters")
            .document(semester)
            .collection("courses")
            .document(courseCode);

    docRef.update("prereqsMet", prereqsMet);
    System.out.println(courseCode + " updated to " + prereqsMet);
  }

  /**
   * updates the user's capstone course that stored in Firestore
   *
   * @param uid
   * @param semester
   * @param courseCode
   * @param isCapstone
   */
  @Override
  public void updateIsCapstoneField(
      String uid, String semester, String courseCode, Boolean isCapstone) {
    Firestore db = FirestoreClient.getFirestore();
    String fullPath = "users/" + uid + "/semesters/" + semester + "/courses";
    DocumentReference docRef = db.collection(fullPath).document(courseCode);

    Map<String, Object> updates = new HashMap<>();
    updates.put("isCapstone", isCapstone);

    //    System.out.println("Updating path: " + fullPath + ", doc: " + courseCode);
    docRef.set(updates, SetOptions.merge());
  }

  /**
   * returns which semester a user took a given capstone course
   *
   * @param uid
   * @param courseCode
   * @return
   * @throws ExecutionException
   * @throws InterruptedException
   */
  @Override
  public String findSemesterOfCapstone(String uid, String courseCode)
      throws ExecutionException, InterruptedException {
    CollectionReference semestersRef = db.collection("users/" + uid + "/semesters");
    ApiFuture<QuerySnapshot> semestersFuture = semestersRef.get();
    List<QueryDocumentSnapshot> semesters = semestersFuture.get().getDocuments();

    for (QueryDocumentSnapshot semesterDoc : semesters) {
      String semesterId = semesterDoc.getId();
      CollectionReference coursesRef = semesterDoc.getReference().collection("courses");
      List<QueryDocumentSnapshot> courseDocs = coursesRef.get().get().getDocuments();

      for (QueryDocumentSnapshot courseDoc : courseDocs) {
        Boolean isCapstone = courseDoc.getBoolean("isCapstone");
        if (courseDoc.getId().equals(courseCode) && Boolean.TRUE.equals(isCapstone)) {
          return semesterId;
        }
      }
    }

    return null;
  }
}
  //  @Override
  //  public void updatePrereqsMet(String uid, String semester, String courseCode, boolean
  // prereqsMet) {
  //
  //    if (uid == null || semester == null || courseCode == null) {
  //      throw new IllegalArgumen
