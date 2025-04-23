import static org.testng.Assert.assertFalse;
import static org.testng.Assert.assertTrue;
import static org.testng.AssertJUnit.assertEquals;

import com.squareup.moshi.Moshi;
import com.squareup.moshi.JsonAdapter;
import com.squareup.moshi.Types;
import okio.Buffer;

import edu.brown.cs.student.main.server.handlers.FindKeywordHandler;
import edu.brown.cs.student.main.server.parser.GeoJsonObject;
import edu.brown.cs.student.main.server.parser.GeoJsonObject.Feature;
import edu.brown.cs.student.main.server.parser.GeoJsonObject.Geometry;
import edu.brown.cs.student.main.server.parser.GeoJsonObject.Properties;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;

import spark.Spark;

import java.io.IOException;
import java.lang.reflect.Type;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.List;
import java.util.Map;

public class FindKeywordHandlerTest {

  private static final Moshi moshi = new Moshi.Builder().build();
  private static final Type mapType = Types.newParameterizedType(Map.class, String.class, Object.class);
  private static final JsonAdapter<Map<String, Object>> adapter = moshi.adapter(mapType);

  @Before
  public void setup() throws IOException {
    GeoJsonObject mockData = createMockGeoJson();
    Spark.port(0); // use any open port
    Spark.get("/find-keyword", new FindKeywordHandler(mockData));
    Spark.awaitInitialization();
  }

  @After
  public void tearDown() {
    Spark.stop();
    Spark.awaitStop();
  }

  // valid keyword query "sales"
  @Test
  public void testValidKeyword() throws IOException {
    int port = Spark.port();
    HttpURLConnection conn = (HttpURLConnection) new URL(
        "http://localhost:" + port + "/find-keyword?keyword=sales"
    ).openConnection();

    conn.setRequestMethod("GET");
    assertEquals(200, conn.getResponseCode());

    Map<String, Object> response = adapter.fromJson(new Buffer().readFrom(conn.getInputStream()));
    conn.disconnect();

    assertEquals("success", response.get("response_type"));

    List<Geometry> features = (List<Geometry>) response.get("features");
    assertFalse(features.isEmpty(), "Expected matching feature for keyword 'sales'");
  }

  // invalid keyword query for "helicopter", which is not in mock json
  @Test
  public void testKeywordNotFound() throws IOException {
    int port = Spark.port();
    HttpURLConnection conn = (HttpURLConnection) new URL(
        "http://localhost:" + port + "/find-keyword?keyword=helicopter"
    ).openConnection();

    conn.setRequestMethod("GET");
    assertEquals(200, conn.getResponseCode());

    Map<String, Object> response = adapter.fromJson(new Buffer().readFrom(conn.getInputStream()));
    conn.disconnect();

    assertEquals("success", response.get("response_type"));

    List<Geometry> features = (List<Geometry>) response.get("features");
    assertTrue(features.isEmpty(), "Expected no matching features for keyword 'giraffe'");
  }

  // Helper method to create mock GeoJSON with one feature with sales keyword
  private GeoJsonObject createMockGeoJson() {
    GeoJsonObject mock = new GeoJsonObject();
    mock.type = "FeatureCollection";

    Feature feature = new Feature();
    feature.type = "Feature";

    Geometry geometry = new Geometry();
    geometry.type = "MultiPolygon";
    geometry.coordinates = List.of(List.of(List.of(
        List.of(-71.1, 42.3),
        List.of(-71.1, 42.4),
        List.of(-71.0, 42.4),
        List.of(-71.0, 42.3),
        List.of(-71.1, 42.3)
    )));
    feature.geometry = geometry;

    Properties props = new Properties();
    props.city = "Test City";
    props.holc_grade = "A";
    props.area_description_data = Map.of(
        "1", "This area has strong sales potential.",
        "2", "Nothing about giraffes here."
    );
    feature.properties = props;

    mock.features = List.of(feature);
    return mock;
  }
}