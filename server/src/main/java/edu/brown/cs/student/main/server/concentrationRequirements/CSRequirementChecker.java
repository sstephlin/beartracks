package edu.brown.cs.student.main.server.concentrationRequirements;

import edu.brown.cs.student.main.server.concentrationRequirements.CSCapstoneCourses;
import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class CSRequirementChecker {
  private StorageInterface storageHandler;
  private String uid;
  private Set<String> userCourses;
  private Map<String, RequirementRule> requirements;
  private Set<String> usedCourses = new HashSet<>();

  public CSRequirementChecker(StorageInterface storageHandler, String uid, Set<String> userCourses, Map<String, RequirementRule> requirements) {
    this.storageHandler = storageHandler;
    this.uid = uid;
    this.userCourses = userCourses;
    this.requirements = requirements;

  }

  // New method: returns a Map of requirement name -> list of fulfilling courses
  public Map<String, List<String>> checkAllRequirements() {
    Map<String, List<String>> results = new HashMap<>();

    for (String requirementName : requirements.keySet()) {
      List<String> fulfillingCourses;

      if (requirementName.equals("Technical Courses")) {
        fulfillingCourses = checkTechnicalCourses();
      } else if (requirementName.equals("Electives")) {
        fulfillingCourses = checkElectives();
      } else if (requirementName.equals("Capstone")) {
        fulfillingCourses = checkCapstone();
      } else if (requirementName.equals("Intro Part 2")) {
        fulfillingCourses = checkIntroPart2();
      } else {
        fulfillingCourses = checkStandardRequirement(requirementName);
      }

      results.put(requirementName, fulfillingCourses);
    }

    return results;
  }

  // Modified: now returns list of courses instead of boolean
  private List<String> checkStandardRequirement(String requirementName) {
    RequirementRule rule = requirements.get(requirementName);
    List<String> matchedCourses = new ArrayList<>();

    if (rule == null) {
      return matchedCourses;
    }

    Set<String> availableCourses = getAvailableCourses();
    int matches = 0;

    for (String course : rule.getAcceptableCourses()) {
      if (availableCourses.contains(course)) {
        matchedCourses.add(course);
        usedCourses.add(course);
        matches++;
        if (matches >= rule.getHowManyNeeded()) {
          break;
        }
      }
    }

    if (matches < rule.getHowManyNeeded() && rule.getSubstitutions() != null) {
      for (String sub : rule.getSubstitutions()) {
        if (availableCourses.contains(sub)) {
          matchedCourses.add(sub);
          usedCourses.add(sub);
          break;
        }
      }
    }

    return matchedCourses;
  }

  // Modified: now returns list
  private List<String> checkTechnicalCourses() {
    List<String> matchedCourses = new ArrayList<>();
    Set<String> availableCourses = getAvailableCourses();
    int count = 0;

    for (String course : availableCourses) {
      if (course.startsWith("CSCI")) {
        try {
          int number = Integer.parseInt(course.replaceAll("[^0-9]", ""));
          if (number >= 1000 && !course.equals("CSCI 1970")) {
            matchedCourses.add(course);
            usedCourses.add(course);
            count++;
            if (count >= requirements.get("Technical Courses").getHowManyNeeded()) {
              break;
            }
          }
        } catch (NumberFormatException e) {
          // ignore
        }
      }
    }

    return matchedCourses;
  }

  /**
   * checks all the possible elective courses user could take (linear algebra, approved non-cs
   * @return
   */
  private List<String> checkElectives() {
    List<String> matchedCourses = new ArrayList<>();
    int electivesSatisfied = 0;
    boolean linearAlgebraUsed = false;
    int csci1970Count = 0;

    int nonCsCoursesUsed = 0;
    int nonTechnicalArtsCoursesUsed = 0;

    int nonCsLimit = (requirements.size() == 10) ? 1 : 3; // AB: 1, ScB: 3
    int nonTechnicalArtsLimit = (requirements.size() == 10) ? 1 : 3; // AB: 1, ScB: 3

    Set<String> linearAlgebraCourses = Set.of("MATH 0520", "MATH 0540", "APMA 0260");
    Set<String> specialElectives =
        new HashSet<>(requirements.get("Electives").getAcceptableCourses());
    Set<String> availableCourses = getAvailableCourses();

    for (String course : availableCourses) {
      if (linearAlgebraCourses.contains(course)) {
        if (!linearAlgebraUsed) {
          matchedCourses.add(course);
          usedCourses.add(course);
          electivesSatisfied++;
          linearAlgebraUsed = true;
        }
      } else if (specialElectives.contains(course)) {
        matchedCourses.add(course);
        usedCourses.add(course);
        electivesSatisfied++;
      } else if (course.startsWith("CSCI")) {
        try {
          int number = Integer.parseInt(course.replaceAll("[^0-9]", ""));
          if (number >= 1000) {
            if (ARTS_POLICY_HUM_CS_COURSES.contains(course)) { // check if there are any arts/policy/humanitise CS courses
              if (nonTechnicalArtsCoursesUsed < nonTechnicalArtsLimit) {
                matchedCourses.add(course);
                usedCourses.add(course);
                electivesSatisfied++;
                nonTechnicalArtsCoursesUsed++;
              }
            } else {
              if (course.equals("CSCI 1970")) {
                csci1970Count++;
                if (csci1970Count <= 2) {
                  matchedCourses.add(course);
                  usedCourses.add(course);
                  electivesSatisfied++;
                }
              } else {
                matchedCourses.add(course);
                usedCourses.add(course);
                electivesSatisfied++;
              }
            }
          }
        } catch (NumberFormatException e) {
          // ignore
        }
      } else if (isAllowedNonCSCourse(course)) { // Handle non-CS department courses
        if (nonCsCoursesUsed < nonCsLimit) {
          matchedCourses.add(course);
          usedCourses.add(course);
          electivesSatisfied++;
          nonCsCoursesUsed++;
        }
      }

      if (electivesSatisfied >= requirements.get("Electives").getHowManyNeeded()) {
        break;
      }
    }

    return matchedCourses;
  }

  /**
   * checks that a user's courses includes a capstone course (either one of the 3 special
   * capstone classes OR if the user checkmarks it separately)
   *
   * @return a list of the first capstone-eligible course that a user has taken
   */
  private List<String> checkCapstone() {
    List<String> matchedCourses = new ArrayList<>();

    // Use your shared constant
    Set<String> autoCapstones = new HashSet<>(CSCapstoneCourses.AUTO_ACCEPTED);

    // get which course the user chose to be their capstone
    String userSelectedCapstone = storageHandler.getCapstoneCourse(uid);

    for (String course : userCourses) {
      // 1. either the user chose one of the 3 special capstone courses OR...
      if (autoCapstones.contains(course)) {
        matchedCourses.add(course);
        usedCourses.add(course);
        break;
      }

      // 2. ...the user marked a course as their capstone course on the frontend
      if (userSelectedCapstone != null && course.equals(userSelectedCapstone)) {
        matchedCourses.add(course);
        usedCourses.add(course);
        break;
      }
    }

    return matchedCourses; // empty if case 1 doesn't apply or user didn't choose a capstone course yet
  }

  // Modified: now returns list
  private List<String> checkIntroPart2() {
    List<String> matchedCourses = new ArrayList<>();

    if (userCourses.contains("CSCI 0200") && !usedCourses.contains("CSCI 0200")) {
      matchedCourses.add("CSCI 0200");
      usedCourses.add("CSCI 0200");
      return matchedCourses;
    }

    if (userCourses.contains("CSCI 0190")) {
      for (String course : getAvailableCourses()) {
        if (course.startsWith("CSCI")) {
          try {
            int number = Integer.parseInt(course.replaceAll("[^0-9]", ""));
            if (number >= 200) {
              matchedCourses.add(course);
              usedCourses.add(course);
              return matchedCourses;
            }
          } catch (NumberFormatException e) {
            // ignore
          }
        }
      }
    }

    return matchedCourses;
  }

  private Set<String> getAvailableCourses() {
    Set<String> available = new HashSet<>(userCourses);
    available.removeAll(usedCourses);
    return available;
  }

  private boolean allowsCapstoneReuse() {
    return requirements.size() > 10;
  }

  private int getNonTechnicalLimit() {
    if (requirements.size() == 10) {
      return 1;
    } else {
      return 3;
    }
  }

  // ex: 6/16 for Sc.B
  public int countCoursesCompleted() {
    int completedCourses = 0;
    Map<String, List<String>> requirementResults = this.checkAllRequirements();

    for (Map.Entry<String, List<String>> entry : requirementResults.entrySet()) {
      List<String> fulfillingCourses = entry.getValue();
      if (fulfillingCourses != null) {
        completedCourses += fulfillingCourses.size();
      }
    }

    return completedCourses;
  }

  // based on requirements size, we know if user is AB or ScB
  public int getTotalCoursesRequired() {
    if (requirements.size() == 10) {
      return 10; // AB requirements
    } else {
      return 16; // ScB requirements
    }
  }

  // electives: courses OUTSIDE of cs that count
  public static final Set<String> ALLOWED_NON_CS_COURSES = Set.of(
      "APMA 1160", "APMA 1690", "APMA 1170", "APMA 1200", "APMA 1210",
      "APMA 1360", "APMA 1650", "APMA 1655", "APMA 1660", "APMA 1670",
      "APMA 1710", "APMA 1720", "APMA 1740", "APMA 1910", "APMA 1930W", "APMA 1930X",
      "PHP2630", "PHP2650",
      "CLPS 1211", "CLPS 1291", "CLPS 1342", "CLPS 1350", "CLPS 1491", "CLPS 1520", "CLPS 1950",
      "DATA 1030", "DATA 1340", "DATA 1080",
      "DEVL 1810",
      "EEPS 1340", "EEPS 1720",
      "ECON 1490", "ECON 1870",
      "ENGN 1010", "ENGN 1570", "ENGN 1580", "ENGN 1600", "ENGN 1610", "ENGN 1630",
      "ENGN 1640", "ENGN 1650", "ENGN 1660", "ENGN 1800", "ENGN 1931J", "ENGN 1931T", "ENGN 2520",
      "IAPA 1701A", "IAPA 1801",
      "MUSC 1210",
      "NEUR 1440", "NEUR 1660",
      "PHIL 1630", "PHIL 1635", "PHIL 1880", "PHIL 1855",
      "PHYS 1600", "PHYS 2550",
      "PHP 1855",
      "PLCY 1702X"
  );

  // electives: Arts/Policy/Humanities courses (non-technical CSCI courses)
  public static final Set<String> ARTS_POLICY_HUM_CS_COURSES = Set.of(
      "CSCI 1250", "CSCI 1280", "CSCI 1360", "CSCI 1370", "CSCI 1800", "CSCI 1805",
      "CSCI 1860", "CSCI 1870", "CSCI 1952B", "CSCI 1952X", "CSCI 2002", "CSCI 2402C",
      "CSCI 2952S", "CSCI 2999A",
      "APMA 1910", "DEVL 1810", "IAPA 1701A", "IAPA 1801", "PLCY 1702X",
      "ENGN 1800", "ENGN 1931J" // ENGN 1800/1931J counts as arts/policy too
  );

  /**
   * checks if a non CSCI course is approved to count as an elective
   *
   * @param courseCode - ex: DATA 1040
   * @return true or false
   */
  private boolean isAllowedNonCSCourse(String courseCode) {
    // first, check if user is taking any 1000+ math class
    if (courseCode.startsWith("MATH")) {
      try {
        int number = Integer.parseInt(courseCode.replaceAll("[^0-9]", ""));
        return number >= 1000;
      } catch (NumberFormatException e) {
        return false;
      }
    }
    // if not, check if their non cs course is in the set above
    return ALLOWED_NON_CS_COURSES.contains(courseCode);
  }
}