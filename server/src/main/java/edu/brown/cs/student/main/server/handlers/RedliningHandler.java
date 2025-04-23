package edu.brown.cs.student.main.server.handlers;

import edu.brown.cs.student.main.server.parser.GeoJsonObject;
import edu.brown.cs.student.main.server.parser.GeoJsonObject.Feature;
import edu.brown.cs.student.main.server.parser.GeoJsonObject.Geometry;
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
public class RedliningHandler implements Route {

  private final GeoJsonObject geoJsonData;

  public RedliningHandler(GeoJsonObject geoJsonData) throws IOException {
    this.geoJsonData = geoJsonData;
  }

  @Override
  public Object handle(Request request, Response response) {

    Map<String, Object> responseMap = new HashMap<>();

    try {
      // Parse bounding box query parameters
      double minLat = Double.parseDouble(request.queryParams("minLat"));
      double maxLat = Double.parseDouble(request.queryParams("maxLat"));
      double minLng = Double.parseDouble(request.queryParams("minLng"));
      double maxLng = Double.parseDouble(request.queryParams("maxLng"));

      List<Feature> allFeatures = geoJsonData.features;
      List<Feature> filtered = new ArrayList<>();

      for (Feature feature : allFeatures) {
        Geometry geometry = feature.geometry;
        if (geometry == null)
          continue;

        if (isFeatureWithinBounds(geometry, minLat, maxLat, minLng, maxLng)) {
          filtered.add(feature);
        }
      }

      responseMap.put("response_type", "success");
      responseMap.put("features", filtered);

    } catch (Exception e) {
      e.printStackTrace();
      responseMap.put("response_type", "error");
      responseMap.put("message", e.getMessage());
    }

    return Utils.toMoshiJson(responseMap);
  }

  /**
   * Returns true if all coordinates of the geometry are within the bounding box.
   */
  public boolean isFeatureWithinBounds(
      Geometry geometry, double minLat, double maxLat, double minLng, double maxLng) {
    // Flatten the nested coordinates (e.g., for polygons or multipolygons)
    List<List<Double>> flatCoords = getFlattenedCoordinates(geometry.coordinates);

    for (List<Double> coord : flatCoords) {
      double lon = coord.get(0);
      double lat = coord.get(1);

      if (lat < minLat || lat > maxLat || lon < minLng || lon > maxLng) {
        return false; // If any point is outside, exclude the feature
      }
    }

    return true;
  }

  public List<List<Double>> getFlattenedCoordinates(List<List<List<List<Double>>>> coordinates) {
    List<List<Double>> flattened = new ArrayList<>();

    if (coordinates == null)
      return flattened;

    for (List<List<List<Double>>> polygon : coordinates) {
      for (List<List<Double>> ring : polygon) {
        for (List<Double> point : ring) {
          if (point.size() >= 2) {
            flattened.add(point); // [lon, lat]
          }
        }
      }
    }
    return flattened;
  }
}