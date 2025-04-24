package edu.brown.cs.student.main.server.storage;

import com.google.cloud.firestore.DocumentReference;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

public interface StorageInterface {

  void addDocument(String uid, String collection_id, String doc_id, Map<String, Object> data);

  void deleteDocument(DocumentReference doc);

  List<Map<String, Object>> getCollection(String uid, String collection_id)
      throws InterruptedException, ExecutionException;

  //  void clearUser(String uid) throws InterruptedException, ExecutionException;

  void clearCollection(String uid, String collectionName)
      throws InterruptedException, ExecutionException;

  //  List<String> getAllUserIds() throws InterruptedException, ExecutionException;
  List<Map<String, Object>> getAllUserPins() throws InterruptedException, ExecutionException;
}
