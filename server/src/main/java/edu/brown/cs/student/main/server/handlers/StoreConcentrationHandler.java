package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.HashMap;
import java.util.Map;
import spark.Request;
import spark.Response;
import spark.Route;

public class StoreConcentrationHandler implements Route {
  private final StorageInterface storageHandler;

  public StoreConcentrationHandler(StorageInterface storageHandler) {
    this.storageHandler = storageHandler;
  }

  @Override
  public Object handle(Request request, Response response) throws Exception {
    Map<String, Object> responseMap = new HashMap<>();
    try {
      String uid = request.queryParams("uid");
      String concentration = request.queryParams("concentration");

      if (uid == null || concentration == null) {
        throw new IllegalArgumentException("Missing required query parameters");
      }

      Map<String, Object> concentrationData = new HashMap<>();
      concentrationData.put("concentration", concentration);

      storageHandler.addDocument(uid, "concentration", "current", concentrationData);

      responseMap.put("response_type", "success");
      responseMap.put("message", "Set concentration as: " + concentration + " for user " + uid);
    } catch (Exception e) {
      e.printStackTrace();
      responseMap.put("response_type", "failure");
      responseMap.put("error", e.getMessage());
    }

    response.type("application/json");
    return Utils.toMoshiJson(responseMap);
  }
}
