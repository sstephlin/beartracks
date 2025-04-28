package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.HashMap;
import java.util.Map;
import spark.Request;
import spark.Response;
import spark.Route;

public class GetConcentrationHandler implements Route {
  private final StorageInterface storageHandler;

  public GetConcentrationHandler(StorageInterface storageHandler) {
    this.storageHandler = storageHandler;
  }

  @Override
  public Object handle(Request request, Response response) throws Exception {
    Map<String, Object> responseMap = new HashMap<>();
    try {
      String uid = request.queryParams("uid");
      if (uid == null) {
        throw new IllegalArgumentException("Missing uid parameter");
      }

      String concentration = storageHandler.getConcentration(uid);
      if (concentration == null) {
        concentration = "Undeclared"; // Default
      }

      responseMap.put("response_type", "success");
      responseMap.put("concentration", concentration);

    } catch (Exception e) {
      e.printStackTrace();
      responseMap.put("response_type", "failure");
      responseMap.put("error", e.getMessage());
    }

    return Utils.toMoshiJson(responseMap);
  }
}
