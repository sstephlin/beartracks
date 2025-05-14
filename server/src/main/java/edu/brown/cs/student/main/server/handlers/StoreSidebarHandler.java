package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.HashMap;
import java.util.Map;
import spark.Request;
import spark.Response;
import spark.Route;

public class StoreSidebarHandler implements Route {
  private final StorageInterface storageHandler;

  public StoreSidebarHandler(StorageInterface storageHandler) {
    this.storageHandler = storageHandler;
  }

  @Override
  public Object handle(Request request, Response response) throws Exception {
    Map<String, Object> responseMap = new HashMap<>();
    try {
      String uid = request.queryParams("uid");
      String expanded = request.queryParams("expanded");

      if (uid == null || expanded == null) {
        throw new IllegalArgumentException("Missing required query parameters");
      }

      Map<String, Object> expandedData = new HashMap<>();
      expandedData.put("expanded", expanded);

      storageHandler.addDocument(uid, "expanded", "current", expandedData);

      responseMap.put("response_type", "success");
      responseMap.put("message", "Set expanded as: " + expanded + " for user " + uid);
    } catch (Exception e) {
      e.printStackTrace();
      responseMap.put("response_type", "failure");
      responseMap.put("error", e.getMessage());
    }

    response.type("application/json");
    return Utils.toMoshiJson(responseMap);
  }
}
