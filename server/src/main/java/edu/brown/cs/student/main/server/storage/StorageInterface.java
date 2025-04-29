package edu.brown.cs.student.main.server.storage;

import com.google.cloud.firestore.DocumentReference;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

public interface StorageInterface {

  void addDocument(String uid, String collection_id, String doc_id, Map<String, Object> data);

  void deleteDocument(DocumentReference doc);

  Map<String, List<String>> getAllSemestersAndCourses(String uid)
      throws InterruptedException, ExecutionException, IllegalArgumentException;

  String getView(String uid) throws Exception;

  String getConcentration(String uid) throws Exception;
}
