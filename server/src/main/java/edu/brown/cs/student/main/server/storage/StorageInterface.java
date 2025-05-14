package edu.brown.cs.student.main.server.storage;

import com.google.cloud.firestore.DocumentReference;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ExecutionException;

public interface StorageInterface {

  void addDocument(String uid, String collection_id, String doc_id, Map<String, Object> data);

  void deleteDocument(DocumentReference doc);

  Map<String, List<String>> getAllSemestersAndCourses(String uid) throws Exception;

  String getView(String uid) throws Exception;

  String getExpanded(String uid) throws Exception;

  String getConcentration(String uid) throws Exception;

  Set<String> getAllUserCourses(String userId) throws ExecutionException, InterruptedException;

  Map<String, List<Map<String, Object>>> getAllSemestersAndCourses(String uid, boolean includeTitle)
      throws Exception;

  String getCapstoneCourse(String uid);

  void updateIsCapstoneField(String uid, String semester, String courseCode, Boolean isCapstone);

  void updatePrereqsMet(String uid, String semester, String courseCode, boolean prereqsMet);

  // Returns the semester (e.g. "Fall 2024") that contains the capstone course
  String findSemesterOfCapstone(String uid, String courseCode)
      throws ExecutionException, InterruptedException;
}
