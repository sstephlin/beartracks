import static org.testng.Assert.assertTrue;
import static org.testng.AssertJUnit.assertEquals;
import static org.testng.AssertJUnit.assertNotNull;

import com.squareup.moshi.JsonAdapter;
import com.squareup.moshi.Moshi;
import com.squareup.moshi.Types;
import java.lang.reflect.Type;
import java.util.Map;
import okio.Buffer;

import edu.brown.cs.student.main.server.parser.GeoJsonObject;
import edu.brown.cs.student.main.server.parser.GeoJsonObject.Feature;
import edu.brown.cs.student.main.server.parser.GeoJsonObject.Geometry;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.List;
import org.testng.annotations.Test;

public class ApiRedliningHandlerTest {

  // tests valid query sent to api-redlining endpoint
  @Test
  public void testValidQuery() throws IOException {
    // 1. Construct bounding box around Providence, RI
    double minLat = 41.0;
    double maxLat = 42.5;
    double minLng = -72.0;
    double maxLng = -70.0;

    // 2. Create URL and open connection
    String urlString = String.format(
        "http://localhost:1234/api-redlining?minLat=%.6f&maxLat=%.6f&minLng=%.6f&maxLng=%.6f",
        minLat, maxLat, minLng, maxLng);
    HttpURLConnection clientConnection = (HttpURLConnection) new URL(urlString).openConnection();
    clientConnection.setRequestMethod("GET");

    // 3. Check response code
    assertEquals(200, clientConnection.getResponseCode());

    // 4. Parse JSON using Moshi
    Moshi moshi = new Moshi.Builder().build();
    JsonAdapter<GeoJsonObject> adapter = moshi.adapter(GeoJsonObject.class);
    GeoJsonObject response =
        adapter.fromJson(new Buffer().readFrom(clientConnection.getInputStream()));
    clientConnection.disconnect();

    // 5. Check every coordinate in every feature
    for (Feature feature : response.features) {
      Geometry geometry = feature.geometry;
      assertNotNull(geometry);
      List<List<List<List<Double>>>> coords = geometry.coordinates;
      assertNotNull(coords);

      for (List<List<List<Double>>> polygon : coords) {
        for (List<List<Double>> ring : polygon) {
          for (List<Double> point : ring) {
            double lon = point.get(0);
            double lat = point.get(1);

            assertTrue(lat >= minLat && lat <= maxLat,
                "Latitude out of bounds: " + lat);
            assertTrue(lon >= minLng && lon <= maxLng,
                "Longitude out of bounds: " + lon);
          }
        }
      }
    }
  }

  // tests invalid query to api-redlining endpoint that returns error message
  @Test
  public void testMissingQueryParam() throws IOException {
    // missing minLat query parameter
    String urlString = "http://localhost:1234/api-redlining?maxLat=42.5&minLng=-72.0&maxLng=-70.0";
    HttpURLConnection clientConnection = (HttpURLConnection) new URL(urlString).openConnection();
    clientConnection.setRequestMethod("GET");

    // Should still return 200 (connection succeeded), but with an error in the response body
    assertEquals(200, clientConnection.getResponseCode());

    // Parse response as generic JSON map
    Moshi moshi = new Moshi.Builder().build();
    Type mapType = Types.newParameterizedType(Map.class, String.class, Object.class);
    JsonAdapter<Map<String, Object>> adapter = moshi.adapter(mapType);
    Map<String, Object> responseMap =
        adapter.fromJson(new Buffer().readFrom(clientConnection.getInputStream()));

    clientConnection.disconnect();

    assertNotNull(responseMap);
    assertEquals("error", responseMap.get("response_type"));
    assertTrue(responseMap.get("message").toString().contains("Cannot invoke"));
  }
}
