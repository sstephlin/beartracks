package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.HashMap;
import java.util.Map;
import spark.Request;
import spark.Response;
import spark.Route;

public class StoreViewHandler implements Route {
  private final StorageInterface storageHandler;

  public StoreViewHandler(StorageInterface storageHandler) {
    this.storageHandler = storageHandler;
  }

  @Override
  public Object handle(Request request, Response response) throws Exception {
    Map<String, Object> responseMap = new HashMap<>();
    try {
      String uid = request.queryParams("uid");
      String view = request.queryParams("view");

      if (uid == null || view == null) {
        throw new IllegalArgumentException("Missing required query parameters");
      }

      Map<String, Object> viewData = new HashMap<>();
      viewData.put("view", view);

      storageHandler.addDocument(uid, "view", "current", viewData);

      responseMap.put("response_type", "success");
      responseMap.put("message", "Set view as: " + view + " for user " + uid);
    } catch (Exception e) {
      e.printStackTrace();
      responseMap.put("response_type", "failure");
      responseMap.put("error", e.getMessage());
    }

    response.type("application/json");
    return Utils.toMoshiJson(responseMap);
  }
}
