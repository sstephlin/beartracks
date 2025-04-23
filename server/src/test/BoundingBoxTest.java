import static org.testng.AssertJUnit.assertFalse;
import static org.testng.AssertJUnit.assertTrue;

import edu.brown.cs.student.main.server.handlers.RedliningHandler;
import edu.brown.cs.student.main.server.parser.GeoJsonObject;
import edu.brown.cs.student.main.server.parser.GeoJsonObject.Geometry;
import edu.brown.cs.student.main.server.parser.JSONParser2;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.testng.annotations.Test;
import spark.Request;
import spark.Response;

public class BoundingBoxTest {
  private final RedliningHandler handler = new RedliningHandler(null); // you don't need GeoJsonObject here

  // empty constructor
  public BoundingBoxTest() throws IOException {
  }

  /** Helper method to create a Geometry with a single [lon, lat] point for tests below*/
  private Geometry makeGeometryWithPoint(double lat, double lon) {
    Geometry g = new Geometry();
    List<Double> point = List.of(lon, lat); // GeoJSON uses [lon, lat]
    List<List<Double>> ring = List.of(point);
    List<List<List<Double>>> polygon = List.of(ring);
    g.coordinates = List.of(polygon);
    return g;
  }

  // Providence-ish
  @Test
  public void testPointInsideBounds() {
    Geometry g = makeGeometryWithPoint(42.0, -71.0);
    assertTrue(handler.isFeatureWithinBounds(g, 40, 45, -75, -70));
  }

  // lat too low
  @Test
  public void testPointOutsideLatBounds() {
    Geometry g = makeGeometryWithPoint(10.0, -71.0);
    assertFalse(handler.isFeatureWithinBounds(g, 40, 45, -75, -70));
  }

  // lon too far west
  @Test
  public void testPointOutsideLonBounds() {
    Geometry g = makeGeometryWithPoint(42.0, -100.0);
    assertFalse(handler.isFeatureWithinBounds(g, 40, 45, -75, -70));
  }

  // exactly on min bounds
  @Test
  public void testPointOnBoundaryIncluded() {
    Geometry g = makeGeometryWithPoint(40.0, -75.0);
    assertTrue(handler.isFeatureWithinBounds(g, 40, 45, -75, -70));
  }

  // no points
  @Test
  public void testEmptyCoordinatesReturnsTrue() {
    Geometry g = new Geometry();
    g.coordinates = new ArrayList<>();
    assertTrue(handler.isFeatureWithinBounds(g, 0, 90, -180, 180));
  }
}