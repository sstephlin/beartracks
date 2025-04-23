import static org.testng.AssertJUnit.assertFalse;
import static org.testng.AssertJUnit.assertTrue;

import edu.brown.cs.student.main.server.handlers.AddPinHandler;
import edu.brown.cs.student.main.server.handlers.ClearUserPinsHandler;
import edu.brown.cs.student.main.server.handlers.GetPinsHandler;
import java.util.*;
import org.junit.Before;
import org.junit.Test;
import spark.Request;

public class PinHandlersIntegrationTest {

  private MockDatabase storage;
  private AddPinHandler addPinHandler;
  private GetPinsHandler getPinsHandler;
  private ClearUserPinsHandler clearUserPinsHandler;

  // set up mock database
  @Before
  public void setup() {
    storage = new MockDatabase();
    addPinHandler = new AddPinHandler(storage);
    getPinsHandler = new GetPinsHandler(storage);
    clearUserPinsHandler = new ClearUserPinsHandler(storage);
  }

  private Request mockRequestWithParams(Map<String, String> params) {
    return new Request() {
      @Override public String queryParams(String key) {
        return params.get(key);
      }
    };
  }

  // test add-pin and get-pins endpoints
  @Test
  public void testAddAndGetPins() throws Exception {
    Map<String, String> addParams = new HashMap<>();
    addParams.put("uid", "user1");
    addParams.put("latitude", "40.0");
    addParams.put("longitude", "-70.0");

    addPinHandler.handle(mockRequestWithParams(addParams), null);

    Object result = getPinsHandler.handle(mockRequestWithParams(new HashMap<>()), null);
    String json = result.toString();

    assertTrue(json.contains("\"response_type\":\"success\""));
    assertTrue(json.contains("40.0"));
    assertTrue(json.contains("-70.0"));
  }

  // after adding pins, clear them for user2
  @Test
  public void testClearUserPins() throws Exception {
    // Add a pin first
    Map<String, String> addParams = new HashMap<>();
    addParams.put("uid", "user2");
    addParams.put("latitude", "41.0");
    addParams.put("longitude", "-71.0");
    addPinHandler.handle(mockRequestWithParams(addParams), null);

    // clear pins for user2
    Map<String, String> clearParams = new HashMap<>();
    clearParams.put("uid", "user2");
    clearUserPinsHandler.handle(mockRequestWithParams(clearParams), null);

    // check that pins are gonee
    Object result = getPinsHandler.handle(mockRequestWithParams(new HashMap<>()), null);
    String json = result.toString();

    assertFalse(json.contains("41.0"));
    assertFalse(json.contains("-71.0"));
  }
}
