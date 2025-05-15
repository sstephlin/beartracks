package edu.brown.cs.student.main.server.concentrationRequirements;

import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

// checks a user's set of courses against each of the user's concentration's requirements
public class CSRequirementChecker {
  private StorageInterface storageHandler;
  private String uid;
  private Set<String> userCourses;
  private Map<String, RequirementRule> requirements;
  private Set<String> usedCourses = new HashSet<>();
  private String concentration;

  /**
   * constructor for CSRequirementChecker
   *
   * @param storageHandler - contains all the methods connecting to firebase
   * @param uid- user's id
   * @param userCourses - set of all the courses a user has added to their course plan
   * @param concentration - user's selected concentration
   */
  public CSRequirementChecker(
      StorageInterface storageHandler, String uid, Set<String> userCourses, String concentration) {
    this.storageHandler = storageHandler;
    this.uid = uid;
    this.userCourses = userCourses;
    this.concentration = concentration;

    // defensive checks for empty or null parameters
    if (userCourses.isEmpty()) {
      throw new IllegalArgumentException("No courses found for user.");
    }

    if (this.concentration == null) {
      throw new IllegalArgumentException("No concentration found for user: " + uid);
    }

    // set requirements based on concentration
    switch (this.concentration) {
      case "Computer Science A.B.":
        this.requirements = CSABDegreeRequirements.requirements;
        break;
      case "Computer Science Sc.B.":
        this.requirements = CSScBDegreeRequirements.requirements;
        break;
      default:
        throw new IllegalArgumentException("Unsupported concentration: " + concentration);
    }
  }

  /**
   * lists user courses that fulfill each requirement by calling individual check methods for each
   * requirement
   *
   * @return map of requirement name to list of USER'S courses that fulfill that requirement
   */
  public Map<String, List<String>> checkAllRequirements() {
    System.out.println("Checking requirements for user: " + uid);
    Map<String, List<String>> results = new LinkedHashMap<>();

    List<String> requirementsList =
        List.of(
            "Calculus",
            "Intro Part 1",
            "Intro Part 2",
            "Math Foundation",
            "Foundations AI",
            "Foundations Systems",
            "Foundations Theory",
            "Technical Courses",
            "Electives",
            "Capstone");

    for (String requirementName : requirementsList) {
      if (!this.requirements.containsKey(requirementName)) {
        continue;
      }

      List<String> fulfillingCourses;

      switch (requirementName) {
        case "Technical Courses":
          fulfillingCourses = checkTechnicalCourses();
          break;
        case "Electives":
          fulfillingCourses = checkElectives();
          break;
        case "Capstone":
          fulfillingCourses = checkCapstone();
          break;
        case "Intro Part 2":
          fulfillingCourses = checkIntroPart2();
          break;
        default:
          fulfillingCourses = checkStandardRequirement(requirementName);
      }

      results.put(requirementName, fulfillingCourses);
    }
    System.out.println("results" + results);
    return results;
  }

  /**
   * checks "standard requirements" (AKA Intro Part 1 and 2, Foundations, Math Foundations)
   *
   * @param requirementName - name of requirement
   * @return - list of courses that fulfill the requirement
   */
  private List<String> checkStandardRequirement(String requirementName) {
    RequirementRule rule = this.requirements.get(requirementName);
    List<String> matchedCourses = new ArrayList<>();

    if (rule == null) {
      return matchedCourses;
    }

    Set<String> availableCourses = getAvailableCourses();
    int matches = 0;

    for (String course : rule.getAcceptableCourses()) {
      if (availableCourses.contains(course)) {
        matchedCourses.add(course);
        this.usedCourses.add(course);
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
          this.usedCourses.add(sub);
          break;
        }
      }
    }

    return matchedCourses;
  }

  /**
   * checks which 1000+ csci technical courses a user has taken
   *
   * @return - list of courses that fulfill the requirement
   */
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
            this.usedCourses.add(course);
            count++;
            if (count >= this.requirements.get("Technical Courses").getHowManyNeeded()) {
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
   * checks all the possible elective courses user could take (linear algebra, approved non-cs)
   *
   * @return - list of courses that fulfill the requirement
   */
  private List<String> checkElectives() {
    List<String> matchedCourses = new ArrayList<>();
    int electivesSatisfied = 0;
    boolean linearAlgebraUsed = false;
    int csci1970Count = 0;

    int nonCsCoursesUsed = 0;
    int nonTechnicalArtsCoursesUsed = 0;

    int nonCsLimit = this.concentration.equals("Computer Science A.B.") ? 1 : 3;
    int nonTechnicalArtsLimit = this.concentration.equals("Computer Science A.B.") ? 1 : 3;

    Set<String> linearAlgebraCourses = Set.of("MATH 0520", "MATH 0540", "APMA 0260");
    Set<String> specialElectives =
        new HashSet<>(this.requirements.get("Electives").getAcceptableCourses());
    Set<String> availableCourses = getAvailableCourses();

    for (String course : availableCourses) {
      if (linearAlgebraCourses.contains(course)) {
        if (!linearAlgebraUsed) {
          matchedCourses.add(course);
          this.usedCourses.add(course);
          electivesSatisfied++;
          linearAlgebraUsed = true;
        }
      } else if (specialElectives.contains(course)) {
        matchedCourses.add(course);
        this.usedCourses.add(course);
        electivesSatisfied++;
      } else if (course.startsWith("CSCI")) {
        try {
          int number = Integer.parseInt(course.replaceAll("[^0-9]", ""));
          if (number >= 1000) {
            if (ARTS_POLICY_HUM_CS_COURSES.contains(
                course)) { // check if there are any arts/policy/humanitise CS courses
              if (nonTechnicalArtsCoursesUsed < nonTechnicalArtsLimit) {
                matchedCourses.add(course);
                this.usedCourses.add(course);
                electivesSatisfied++;
                nonTechnicalArtsCoursesUsed++;
              }
            } else {
              if (course.equals("CSCI 1970")) {
                csci1970Count++;
                if (csci1970Count <= 2) {
                  matchedCourses.add(course);
                  this.usedCourses.add(course);
                  electivesSatisfied++;
                }
              } else {
                matchedCourses.add(course);
                this.usedCourses.add(course);
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
          this.usedCourses.add(course);
          electivesSatisfied++;
          nonCsCoursesUsed++;
        }
      }

      if (electivesSatisfied >= this.requirements.get("Electives").getHowManyNeeded()) {
        break;
      }
    }

    return matchedCourses;
  }

  /**
   * checks which capstone course a user selected (retrieved from firestore)
   *
   * @return - list of courses that fulfill the requirement
   */
  private List<String> checkCapstone() {
    List<String> matchedCourses = new ArrayList<>();

    // get which course the user chose to be their capstone
    String userSelectedCapstone = this.storageHandler.getCapstoneCourse(uid);

    if (userSelectedCapstone != null) {
      matchedCourses.add(userSelectedCapstone);
    }
    return matchedCourses;
  }

  /**
   * Checks that a user either took cs200 or another 200+ csci course if they took cs19 as their
   * intro part 1
   *
   * @return - list of courses that fulfill the requirement
   */
  private List<String> checkIntroPart2() {
    List<String> matchedCourses = new ArrayList<>();

    if (this.userCourses.contains("CSCI 0200") && !this.usedCourses.contains("CSCI 0200")) {
      matchedCourses.add("CSCI 0200");
      this.usedCourses.add("CSCI 0200");
      return matchedCourses;
    }

    if (this.userCourses.contains("CSCI 0190")) {
      for (String course : getAvailableCourses()) {
        if (course.startsWith("CSCI")) {
          try {
            int number = Integer.parseInt(course.replaceAll("[^0-9]", ""));
            if (number >= 200) {
              matchedCourses.add(course);
              this.usedCourses.add(course);
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

  /**
   * returns a set of a user's courses that haven't been counted already in concentration categories
   *
   * @return - a set of a user's courses that haven't been counted already in concentration
   *     categories
   */
  private Set<String> getAvailableCourses() {
    Set<String> available = new HashSet<>(this.userCourses);
    available.removeAll(this.usedCourses); // Always remove already-used courses
    return available;
  }

  /**
   * counts how many courses a user has completed, out of the total courses required for their
   * concentration
   *
   * @param requirementResults - maps name of requirement to a list of courses a user has taken that
   *     satisfies that requirement
   * @return an integer value for the number of completed courses
   */
  public int countCoursesCompleted(Map<String, List<String>> requirementResults) {
    int completedCourses = 0;

    // Loop over each requirement and its corresponding list of fulfilling courses that a user has
    // taken
    for (String requirementName : requirementResults.keySet()) {
      List<String> fulfillingCourses = requirementResults.get(requirementName);

      // Add the number of fulfilling courses to the total, if any
      if (fulfillingCourses != null) {
        completedCourses += fulfillingCourses.size();
      }
    }
    System.out.println(completedCourses + " courses completed");
    return completedCourses;
  }

  /**
   * based on user's selected concentration, returns how many total credits/courses they need to
   * fulfill
   *
   * @return - either 10 (A.B.) or 16 (Sc.B)
   */
  public int getTotalCoursesRequired() {
    if ("Computer Science A.B.".equalsIgnoreCase(this.concentration)) {
      return 10;
    } else {
      return 16; // ScB requirements
    }
  }

  // electives: courses OUTSIDE of cs that count
  public static final Set<String> ALLOWED_NON_CS_COURSES =
      Set.of(
          "APMA 1160",
          "APMA 1690",
          "APMA 1170",
          "APMA 1200",
          "APMA 1210",
          "APMA 1360",
          "APMA 1650",
          "APMA 1655",
          "APMA 1660",
          "APMA 1670",
          "APMA 1710",
          "APMA 1720",
          "APMA 1740",
          "APMA 1910",
          "APMA 1930W",
          "APMA 1930X",
          "PHP2630",
          "PHP2650",
          "CLPS 1211",
          "CLPS 1291",
          "CLPS 1342",
          "CLPS 1350",
          "CLPS 1491",
          "CLPS 1520",
          "CLPS 1950",
          "DATA 1030",
          "DATA 1340",
          "DATA 1080",
          "DEVL 1810",
          "EEPS 1340",
          "EEPS 1720",
          "ECON 1490",
          "ECON 1870",
          "ENGN 1010",
          "ENGN 1570",
          "ENGN 1580",
          "ENGN 1600",
          "ENGN 1610",
          "ENGN 1630",
          "ENGN 1640",
          "ENGN 1650",
          "ENGN 1660",
          "ENGN 1800",
          "ENGN 1931J",
          "ENGN 1931T",
          "ENGN 2520",
          "IAPA 1701A",
          "IAPA 1801",
          "MUSC 1210",
          "NEUR 1440",
          "NEUR 1660",
          "PHIL 1630",
          "PHIL 1635",
          "PHIL 1880",
          "PHIL 1855",
          "PHYS 1600",
          "PHYS 2550",
          "PHP 1855",
          "PLCY 1702X");

  // electives: Arts/Policy/Humanities courses (non-technical CSCI courses)
  public static final Set<String> ARTS_POLICY_HUM_CS_COURSES =
      Set.of(
          "CSCI 1250",
          "CSCI 1280",
          "CSCI 1360",
          "CSCI 1370",
          "CSCI 1800",
          "CSCI 1805",
          "CSCI 1860",
          "CSCI 1870",
          "CSCI 1952B",
          "CSCI 1952X",
          "CSCI 2002",
          "CSCI 2402C",
          "CSCI 2952S",
          "CSCI 2999A",
          "APMA 1910",
          "DEVL 1810",
          "IAPA 1701A",
          "IAPA 1801",
          "PLCY 1702X",
          "ENGN 1800",
          "ENGN 1931J" // ENGN 1800/1931J counts as arts/policy too
          );

  /**
   * checks if a non CSCI course is approved to count as an elective
   *
   * @param courseCode - ex: DATA 1030
   * @return true or false for whether a non CSCI course is approved to count as an elective
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
    //    return ALLOWED_NON_CS_COURSES.contains(courseCode);

    return ALLOWED_NON_CS_COURSES.contains(courseCode);
  }
}
