package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.parser.GeoJsonObject;
import edu.brown.cs.student.main.server.parser.GeoJsonObject.Feature;
import edu.brown.cs.student.main.server.parser.GeoJsonObject.Properties;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import spark.Request;
import spark.Response;
import spark.Route;

/**
 * Handles requests to fetch redlining data within a given bounding box. Expected query params:
 * minLat, maxLat, minLng, maxLng
 */
public class FindKeywordHandler implements Route {

  private final GeoJsonObject geoJsonData;

  public FindKeywordHandler(GeoJsonObject geoJsonData) throws IOException {
    this.geoJsonData = geoJsonData;
  }

  @Override
  public Object handle(Request request, Response response) {
    Map<String, Object> responseMap = new HashMap<>();

    try {
      String keyword = request.queryParams("keyword");
      if (keyword == null || keyword.isEmpty()) {
        throw new IllegalArgumentException("Missing keyword query parameter.");
      }

      String keywordLower = keyword.toLowerCase();
      List<Feature> allFeatures = geoJsonData.features; // AKA fullDownload.json
      List<Feature> matchedFeatures = new ArrayList<>(); // stores all matching features

      for (Feature feature : allFeatures) {
        Properties props = feature.properties;
        Map<String, String> descriptionData = props.area_description_data;

        boolean descriptionMatches = false;
        if (descriptionData != null) {
          // loop through all the values, which are the actual descriptions
          for (String value : descriptionData.values()) {
            if (value.toLowerCase().contains(keywordLower)) {
              descriptionMatches = true;
              break;
            }
          }
        }

        if (descriptionMatches) {
          matchedFeatures.add(feature);
        }
      }

      // Build filtered FeatureCollection to return in response json object
      Map<String, Object> geoJsonResponse = new HashMap<>();
      geoJsonResponse.put("type", "FeatureCollection");
      geoJsonResponse.put("features", matchedFeatures);

      responseMap.put("response_type", "success");
      responseMap.put("features", matchedFeatures);

    } catch (Exception e) {
      e.printStackTrace();
      responseMap.put("response_type", "error");
      responseMap.put("message", e.getMessage());
    }

    return Utils.toMoshiJson(responseMap);
  }
}