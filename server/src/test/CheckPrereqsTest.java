import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertThrows;
import static org.junit.Assert.assertTrue;

import edu.brown.cs.student.main.server.handlers.AddCourseHandlerHelper;
import edu.brown.cs.student.main.server.parser.CourseCSVParser;
import edu.brown.cs.student.main.server.parser.CourseCatalog;
import edu.brown.cs.student.main.server.parser.PrereqTreeNode;
import java.util.HashMap;
import java.util.Map;
import org.junit.Test;

public class CheckPrereqsTest {

  // tests a simple case where user adds cs17 and cs200 (which requires cs17 as a prereq)
  @Test
  public void testCheckPrerequisitesMet() throws Exception {
    // 1. Build a mock catalog using a small CSV file
    CourseCatalog catalog = CourseCSVParser.parse("data/mockCourse.csv");// Your mock file

    // 2. Create mock course plan: CSCI 0170 taken in Fall 2023
    Map<String, String> courseToSemester = new HashMap<>();
    courseToSemester.put("CSCI 0170", "Fall 23");

    // 3. Try to add CSCI 0220 in Spring 2024 (requires 0170 as prereq)
    String courseToAdd = "CSCI 0200";
    String targetSemester = "Spring 24";

    boolean prereqsMet = AddCourseHandlerHelper.checkPrerequisites(
        catalog, courseToAdd, targetSemester, courseToSemester
    );

    assertTrue(prereqsMet);
  }

  // tests a case where user tries to add a course when they haven't added its prereq courses
  @Test
  public void testPrerequisitesNotMet() throws Exception {
    CourseCatalog catalog = CourseCSVParser.parse("data/mockCourse.csv");

    Map<String, String> courseToSemester = new HashMap<>();

    // try to add cs200 without adding an intro course
    String courseToAdd = "CSCI 0200";
    String targetSemester = "Spring 24";

    PrereqTreeNode prereqTree = catalog.getPrereqTree("CSCI 0200", "Spring 24");
    boolean prereqsMet = AddCourseHandlerHelper.checkPrerequisites(
        catalog, courseToAdd, targetSemester, courseToSemester
    );

    assertEquals("((CSCI 0112 OR CSCI 0150 OR CSCI 0170 OR CSCI 0190))", prereqTree.toString());
    assertFalse(prereqsMet);
  }
}
