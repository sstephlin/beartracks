package edu.brown.cs.student.main.server.concentrationRequirements;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class RequirementChecker {
  private Set<String> userCourses;
  private Map<String, RequirementRule> requirements;
  private Set<String> usedCourses = new HashSet<>();

  public RequirementChecker(Set<String> userCourses, Map<String, RequirementRule> requirements) {
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

  // Modified: now returns list
  private List<String> checkElectives() {
    List<String> matchedCourses = new ArrayList<>();
    int electivesSatisfied = 0;
    boolean linearAlgebraUsed = false;
    int csci1970Count = 0;
    int nonTechnicalCount = 0;

    Set<String> linearAlgebraCourses = Set.of("MATH 0520", "MATH 0540", "APMA 0260");
    Set<String> specialElectives = new HashSet<>(requirements.get("Electives").getAcceptableCourses());
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
        } catch (NumberFormatException e) {
          // ignore
        }
      } else {
        nonTechnicalCount++;
        if (nonTechnicalCount <= getNonTechnicalLimit()) {
          matchedCourses.add(course);
          usedCourses.add(course);
          electivesSatisfied++;
        }
      }

      if (electivesSatisfied >= requirements.get("Electives").getHowManyNeeded()) {
        break;
      }
    }

    return matchedCourses;
  }

  // Modified: now returns list
  private List<String> checkCapstone() {
    List<String> matchedCourses = new ArrayList<>();
    RequirementRule rule = requirements.get("Capstone");

    for (String course : userCourses) {
      if (rule.getAcceptableCourses().contains(course)) {
        if (!usedCourses.contains(course) || allowsCapstoneReuse()) {
          matchedCourses.add(course);
          usedCourses.add(course);
          break; // Only need one
        }
      }
    }

    return matchedCourses;
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
}
