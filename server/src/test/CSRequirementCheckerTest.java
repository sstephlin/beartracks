import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertThrows;
import static org.junit.Assert.assertTrue;

import edu.brown.cs.student.main.server.concentrationRequirements.CSRequirementChecker;
import edu.brown.cs.student.main.server.storage.MockStorageInterface;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.Test;

public class CSRequirementCheckerTest {
  // tests simple case of user who is comp sci AB with regular intro course and all csci courses, plus math 0520
  @Test
  public void testCheckRequirementsForAB() throws Exception {
    String uid = "test-user";
    String concentration = "Computer Science A.B.";
    Set<String> userCourses = Set.of(
        "CSCI 0150",  // Intro Part 1
        "CSCI 0200",  // Intro Part 2
        "MATH 0520",  // Elective (Linear Algebra)
        "CSCI 1234"   // Auto capstone AND technical elective
    );
    String capstoneCourse = "CSCI 1234";

    MockStorageInterface mockStorage = new MockStorageInterface(concentration, userCourses, capstoneCourse);
    CSRequirementChecker checker = new CSRequirementChecker(mockStorage, uid, userCourses, concentration);
    Map<String, List<String>> results = checker.checkAllRequirements();

    assertTrue(results.get("Intro Part 1").contains("CSCI 0150"));
    assertTrue(results.get("Intro Part 2").contains("CSCI 0200"));
    assertTrue(results.get("Electives").contains("MATH 0520"));
    assertTrue(results.get("Capstone").contains("CSCI 1234"));

    int completed = checker.countCoursesCompleted(results);

    assertEquals(5, completed);  // capstone course gets counted twice
    assertEquals(10, checker.getTotalCoursesRequired());
  }

  // tests same courses as above but with a user who is comp sci ScB
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
    MockStorageInterface mockStorage = new MockStorageInterface(concentration, userCourses,
        capstoneCourse);

    // 3. instantiate the checker
    CSRequirementChecker checker = new CSRequirementChecker(mockStorage, uid, userCourses,
        concentration);

    Map<String, List<String>> results = checker.checkAllRequirements();

    assertTrue(results.get("Intro Part 1").contains("CSCI 0150"));
    assertTrue(results.get("Intro Part 2").contains("CSCI 0200"));
    assertTrue(results.get("Electives").contains("MATH 0520"));
    assertTrue(results.get("Capstone").contains("CSCI 1234"));

    int completed = checker.countCoursesCompleted(results);
    assertEquals(5, completed);  // capstone course gets counted twice
    assertEquals(16, checker.getTotalCoursesRequired());
  }

  // tests special case of cs19 and non auto capstone course
  @Test
  public void testCheckRequirementsCs19() throws Exception {
    String uid = "test-user";
    String concentration = "Computer Science A.B.";
    Set<String> userCourses = Set.of(
        "CSCI 0190",  // Intro Part 1
        "CSCI 0220",  // Math Foundation
        "MATH 0520",  // Elective (Linear Algebra)
        "CSCI 1300"   // Auto capstone AND technical elective
    );
    String capstoneCourse = "CSCI 1300";

    MockStorageInterface mockStorage = new MockStorageInterface(concentration, userCourses, capstoneCourse);
    CSRequirementChecker checker = new CSRequirementChecker(mockStorage, uid, userCourses, concentration);
    Map<String, List<String>> results = checker.checkAllRequirements();

    assertTrue(results.get("Intro Part 1").contains("CSCI 0190"));
    assertTrue(results.get("Intro Part 2").contains("CSCI 1300")); // bc any 200+ level course counts as second intro
    assertTrue(results.get("Math Foundation").contains("CSCI 0220"));
    assertTrue(results.get("Electives").contains("MATH 0520"));
    assertTrue(results.get("Capstone").contains("CSCI 1300"));

    int completed = checker.countCoursesCompleted(results);

    assertEquals(5, completed);  // capstone course gets counted twice
    assertEquals(10, checker.getTotalCoursesRequired());
  }

  // tests when a user hasn't added any courses to their course plan
  @Test
  public void testThrowsOnEmptyCourses() {
    String uid = "test-user";
    String concentration = "Computer Science A.B.";
    Set<String> userCourses = Set.of();

    MockStorageInterface mockStorage = new MockStorageInterface(concentration, userCourses, null);

    assertThrows(IllegalArgumentException.class, () ->
        new CSRequirementChecker(mockStorage, uid, userCourses, concentration) // null concentration
    );
  }

  // tests when a user hasn't set a concentration (null)
  @Test
  public void testThrowsOnNullConcentration() {
    Set<String> userCourses = Set.of("CSCI 0150");
    MockStorageInterface mockStorage = new MockStorageInterface(null, userCourses, null);
    String uid = "test-user";

    assertThrows(IllegalArgumentException.class, () ->
        new CSRequirementChecker(mockStorage, uid, userCourses, null) // null concentration
    );
  }

  // tests that non csci courses get counted as electives
  @Test
  public void testNonCSCICourse() {
    Set<String> userCourses = Set.of(
        "CSCI 0111",  // Intro Part 1
        "CSCI 0200",  // Math Foundation
        "DATA 1030",   // Elective (non-csci course)
        "MATH 1450",
        "CSCI 1234" // capstone course
    );
    String uid = "test-user";
    String concentration = "Computer Science Sc.B.";
    String capstoneCourse = "CSCI 1234";

    MockStorageInterface mockStorage = new MockStorageInterface(concentration, userCourses, capstoneCourse);
    CSRequirementChecker checker = new CSRequirementChecker(mockStorage, uid, userCourses, concentration);
    Map<String, List<String>> results = checker.checkAllRequirements();

    assertTrue(results.get("Intro Part 1").contains("CSCI 0111"));
    assertTrue(results.get("Intro Part 2").contains("CSCI 0200")); // bc any 200+ level course counts as second intro
    assertTrue(results.get("Electives").contains("DATA 1030"));
    assertTrue(results.get("Electives").contains("MATH 1450"));
    assertTrue(results.get("Capstone").contains("CSCI 1234"));

    int completed = checker.countCoursesCompleted(results);

    assertEquals(6, completed);  // capstone course gets counted twice
    assertEquals(16, checker.getTotalCoursesRequired());
  }
}
