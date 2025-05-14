package edu.brown.cs.student.main.server.concentrationRequirements;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Static class that stores all the acceptable courses for each requirement for the CS A.B. degree.
 * This is only run once, when the server starts.
 */
public class CSABDegreeRequirements {
  public static final Map<String, RequirementRule> requirements = new HashMap<>();

  static {
    // Intro sequence - early intro course
    requirements.put(
        "Intro Part 1",
        new RequirementRule(List.of("CSCI 0111", "CSCI 0150", "CSCI 0170", "CSCI 0190"), 1, null));

    // Intro sequence - cs200. For cs19 students, another course numbered 0200 or higher (MANUAL
    // CHECK)
    requirements.put("Intro Part 2", new RequirementRule(List.of("CSCI 0200"), 1, null));

    // Math foundation (main = CSCI 0220, substitutions allowed)
    requirements.put(
        "Math Foundation",
        new RequirementRule(
            List.of("CSCI 0220"),
            1,
            List.of("APMA 1650", "CSCI 1450", "MATH 1530") // transition period for class of 2027
            ));

    // Foundations: AI
    requirements.put(
        "Foundations AI",
        new RequirementRule(
            List.of(
                "CSCI 0410",
                "CSCI 1410",
                "CSCI 1411",
                "CSCI 1420",
                "CSCI 1430",
                "CSCI 1460",
                "CSCI 1470",
                "CSCI 1520",
                "CSCI 1951A",
                "CSCI 1952Q"),
            1,
            null));

    // Foundations: Systems
    requirements.put(
        "Foundations Systems",
        new RequirementRule(List.of("CSCI 0300", "CSCI 0320", "CSCI 0330"), 1, null));

    // Foundations: Theory
    requirements.put(
        "Foundations Theory",
        new RequirementRule(List.of("CSCI 0500", "CSCI 1010", "CSCI 1550", "CSCI 1570"), 1, null));

    // 2 Technical CSCI 1000-level courses (except CSCI 1970, which goes under electives)
    requirements.put(
        "Technical Courses",
        new RequirementRule(
            List.of(), // empty list; handled dynamically in RequirementChecker
            2, null));

    // 2 Electives
    requirements.put(
        "Electives",
        new RequirementRule(
            List.of("MATH 0520", "MATH 0540", "APMA 0260", "CSCI 0300", "CSCI 0320", "CSCI 0330"),
            2,
            null));

    // capstone courses
    List<String> allCapstones = new ArrayList<>();
    allCapstones.addAll(CSCapstoneCourses.AUTO_ACCEPTED);
    allCapstones.addAll(CSCapstoneCourses.ALL);

    requirements.put("Capstone", new RequirementRule(allCapstones, 1, null));
  }
}
