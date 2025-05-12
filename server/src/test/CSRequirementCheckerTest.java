import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import edu.brown.cs.student.main.server.concentrationRequirements.CSRequirementChecker;
import edu.brown.cs.student.main.server.storage.MockStorageInterface;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.Test;

public class CSRequirementCheckerTest {

  // tests
  @Test
  public void testCheckRequirementsForScB() throws Exception {
    // 1. instantiate values to return for mock storage getter methods
    String uid = "test-user";
    String concentration = "Computer Science Sc.B.";
    Set<String> userCourses = Set.of(
        "CSCI 0150",  // Intro Part 1
        "CSCI 0200",  // Intro Part 2
        "MATH 0520",  // Elective (Linear Algebra)
        "CSCI 1234"   // Auto capstone AND technical elective
    );
    String capstoneCourse = "CSCI 1234";

    // 2. instantiate mock storage to pass into the requirements checker
    MockStorageInterface mockStorage = new MockStorageInterface(concentration, userCourses, capstoneCourse);

    // 3. instantiate the checker
    CSRequirementChecker checker = new CSRequirementChecker(mockStorage, uid, userCourses, concentration);

    Map<String, List<String>> results = checker.checkAllRequirements();

    assertTrue(results.get("Intro Part 1").contains("CSCI 0150"));
    assertTrue(results.get("Intro Part 2").contains("CSCI 0200"));
    assertTrue(results.get("Electives").contains("MATH 0520"));
    assertTrue(results.get("Capstone").contains("CSCI 1234"));

    // Check course count
    int completed = checker.countCoursesCompleted(results);
    assertEquals(5, completed);  // capstone course gets counted twice
    assertEquals(16, checker.getTotalCoursesRequired());
  }
}
