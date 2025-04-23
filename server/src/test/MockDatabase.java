import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

// mock database that stores user pins in a hashmap
public class MockDatabase implements StorageInterface {
  private final Map<String, List<Map<String, Object>>> userPins = new HashMap<>();

  @Override
  public void addDocument(String uid, String collection_id, String doc_id,
      Map<String, Object> data) {
    userPins.putIfAbsent(uid, new ArrayList<>());
    userPins.get(uid).add(data);
  }

  @Override
  public List<Map<String, Object>> getCollection(String uid, String collectionName) {
    return userPins.getOrDefault(uid, new ArrayList<>());
  }

  @Override
  public void clearCollection(String uid, String collectionName) {
    userPins.remove(uid);
  }

  @Override
  public List<Map<String, Object>> getAllUserPins() {
    List<Map<String, Object>> all = new ArrayList<>();
    for (Map.Entry<String, List<Map<String, Object>>> entry : userPins.entrySet()) {
      all.addAll(entry.getValue());
    }
    return all;
  }
}
