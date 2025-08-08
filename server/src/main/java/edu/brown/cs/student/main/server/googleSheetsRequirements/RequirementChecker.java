package edu.brown.cs.student.main.server.googleSheetsRequirements;

import edu.brown.cs.student.main.server.storage.StorageInterface;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class RequirementChecker {
  // CRITICAL FIX: Change from List to Map for requirements for direct lookup
  private final Map<String, RequirementRow> requirements;
  private final Set<String> userCourses;
  private final Set<String> usedCourses =
      new HashSet<>(); // Tracks courses used across all categories
  private final StorageInterface storageHandler; // Kept as placeholder
  private final String uid; // Kept as placeholder

  // To store intermediate results for use by 'from_category' and 'elective_total'
  private final Map<String, List<String>> intermediateResults = new LinkedHashMap<>();
  // NEW: To track which standard categories should be skipped due to an active conditional path
  private final Set<String> categoriesToSkip = new HashSet<>();
  // NEW: To store the active alternative categories that need to be processed
  // Maps the category being overridden to its active alternative (e.g., "Intro Part 2 Standard" ->
  // "Intro Part 2 - Alt")
  private final Map<String, String> activeCategoryAlternatives = new HashMap<>();

  // CRITICAL FIX: Constructor signature to match how it's called and how 'requirements' is used
  public RequirementChecker(
      Map<String, RequirementRow> requirements, // Now a Map
      Set<String> userCourses,
      StorageInterface storageHandler,
      String uid) {
    this.requirements = requirements;
    this.userCourses = userCourses;
    this.storageHandler = storageHandler;
    this.uid = uid;
  }

  /**
   * Checks all defined concentration requirements against the user's courses.
   *
   * @return A map where keys are requirement category names and values are lists of courses that
   * satisfy that requirement.
   */
  public Map<String, List<String>> checkAllRequirements() {

    // PHASE 1: Identify and flag activated conditional paths
    // Iterate through all requirements to find 'conditional_path' rules first.
    // Iterate over values() because 'requirements' is now a Map
    for (RequirementRow row : requirements.values()) {
      if ("conditional_path".equals(row.getRuleType())) {
        // Use a special helper that checks for the trigger course without marking it as 'used'.
        List<String> matchedTriggerCourses = matchCourseListForConditional(row);
        if (matchedTriggerCourses.size() >= row.getMinCoursesRequired()) {
          // If this conditional path is active, mark its 'overridesCategory' to be skipped
          // and store its 'alternativeCategory' for processing later.
          String overridesCat = row.getOverridesCategory();
          String alternativeCat = row.getAlternativeCategory();

          if (overridesCat != null && !overridesCat.isEmpty()) { // Ensure not null/empty
            categoriesToSkip.add(overridesCat);
          }
          if (alternativeCat != null && !alternativeCat.isEmpty()) { // Ensure not null/empty
            // Map the overridden category to its alternative
            activeCategoryAlternatives.put(overridesCat, alternativeCat);
          }
        }
      }
    }

    // NEW: Separate course_list and pattern_match rules to enforce processing order
    Map<String, RequirementRow> courseListRules = new LinkedHashMap<>();
    Map<String, RequirementRow> patternMatchRules = new LinkedHashMap<>();

    // PHASE 2: Process standard requirements
    // Exclude 'conditional_path' rules themselves, categories that are overridden by active
    // conditionals,
    // and rules that depend on other categories ('from_category', 'elective_total').
    // Also explicitly exclude any categories that are themselves marked as 'alternativeCategory'
    // because they will be processed specifically in Phase 3 if their parent conditional is active.
    for (RequirementRow row : requirements.values()) {
      String categoryName = row.getCategoryName();
      String ruleType = row.getRuleType();

      // Skip rules that are:
      // 1. A conditional_path definition itself.
      // 2. An 'overridden' category (e.g., "Intro Part 2 Standard" if 0190 was taken).
      // 3. An 'alternative' category (e.g., "Intro Part 2 - Alt" which will be processed in Phase 3
      // if needed).
      // 4. 'from_category' or 'elective_total' (processed in later phases).
      if ("conditional_path".equals(ruleType)
          || categoriesToSkip.contains(categoryName)
          || activeCategoryAlternatives.containsValue(categoryName)
          || // Check if this category is an *alternative* for any active conditional
          "from_category".equals(ruleType)
          || "elective_total".equals(ruleType)) {
        continue;
      }

      switch (ruleType) {
        case "course_list":
          courseListRules.put(categoryName, row);
          break;
        case "pattern_match":
          patternMatchRules.put(categoryName, row);
          break;
        default:
          System.err.println(
              "Warning: Unhandled rule type for category: "
                  + categoryName
                  + " with type "
                  + ruleType);
          break;
      }
    }

    // NEW: Process course_list rules first
    for (RequirementRow row : courseListRules.values()) {
      List<String> matched = matchCourseList(row);
      intermediateResults.put(row.getCategoryName(), matched);
    }

    // NEW: Process pattern_match rules second
    for (RequirementRow row : patternMatchRules.values()) {
      List<String> matched = matchPattern(row);
      intermediateResults.put(row.getCategoryName(), matched);
    }

    // PHASE 3: Process the active alternative categories
    // This loop iterates through the *values* of activeCategoryAlternatives, which are the names
    // of the alternative categories that need to be processed.
    for (String alternativeCategoryName :
        new HashSet<>(
            activeCategoryAlternatives.values())) { // Use HashSet to avoid processing duplicates
      RequirementRow altRow =
          requirements.get(alternativeCategoryName); // Use .get() because 'requirements' is a Map
      if (altRow != null) {
        List<String> matchedAlt = new ArrayList<>();
        switch (altRow.getRuleType()) {
          case "course_list":
            matchedAlt = matchCourseList(altRow);
            break;
          case "pattern_match":
            matchedAlt = matchPattern(altRow);
            break;
          // Add other rule types if your alternative categories can be of those types
          default:
            System.err.println(
                "Warning: Unhandled rule type for alternative category: "
                    + altRow.getCategoryName()
                    + " with type "
                    + altRow.getRuleType());
            break;
        }
        intermediateResults.put(altRow.getCategoryName(), matchedAlt);
      }
    }

    // PHASE 4: Process 'from_category' which depends on other categories being processed
    // This pass needs to happen after all source categories (including conditional ones) are
    // processed.
    // Iterate over values() because 'requirements' is now a Map
    for (RequirementRow row : requirements.values()) {
      if (row.getRuleType().equals("from_category")) {
        List<String> matched = matchFromCategory(row);
        intermediateResults.put(row.getCategoryName(), matched);
      }
    }

    // PHASE 5: Final pass/calculation: Process 'elective_total'
    // This must happen after all individual elective categories are processed.
    // Iterate over values() because 'requirements' is now a Map
    for (RequirementRow row : requirements.values()) {
      if (row.getRuleType().equals("elective_total")) {
        List<String> matched = computeElectiveTotal(row);
        intermediateResults.put(row.getCategoryName(), matched);
        break; // Assuming only one "Electives (Total)" rule
      }
    }

    return intermediateResults;
  }

  /**
   * Helper method to match user courses against a list for conditional triggers. IMPORTANT: This
   * method does NOT add courses to the 'usedCourses' set, as the trigger course might also fulfill
   * another requirement.
   *
   * @param row The RequirementRow containing the course list for the condition.
   * @return A list of courses that matched the trigger, without marking them as used.
   */
  private List<String> matchCourseListForConditional(RequirementRow row) {
    List<String> matches = new ArrayList<>();
    // Do NOT check against usedCourses, and do NOT add to usedCourses
    for (String course : userCourses) {
      if (row.getAcceptedCourses().contains(course)) {
        matches.add(course);
        if (matches.size() >= row.getMinCoursesRequired()) {
          break;
        }
      }
    }
    return matches;
  }

  /**
   * Matches user courses against a list of accepted courses.
   *
   * @param row The RequirementRow containing the course list and min courses required.
   * @return A list of courses that matched.
   */
  private List<String> matchCourseList(RequirementRow row) {
    List<String> matches = new ArrayList<>();
    boolean isCapstone = "Capstone".equalsIgnoreCase(row.getCategoryName());

    for (String course : userCourses) {
      // Check if the course is in the list of accepted courses for this row.
      if (row.getAcceptedCourses().contains(course)) {
        // If it's a capstone, we process it and do not mark it as used for other categories.
        // If it's not a capstone, we only process it if it hasn't been used yet.
        if (isCapstone || !usedCourses.contains(course)) {
          matches.add(course);
          if (!isCapstone) {
            // All courses matched by this method, except capstones, are now considered used.
            // This is the fix for the elective issue.
            usedCourses.add(course);
          }
        }
      }
    }

    // After matching all courses, we check if the minimum requirement is met and prune the list.
    // This handles cases where minCoursesRequired is 0, and we want to capture all courses.
    if (matches.size() < row.getMinCoursesRequired() && row.getSubstitutions() != null) {
      for (String sub : row.getSubstitutions()) {
        if (userCourses.contains(sub) && (isCapstone || !usedCourses.contains(sub))) {
          matches.add(sub);
          if (!isCapstone) {
            usedCourses.add(sub);
          }
        }
      }
    }

    // Prune the matches list if its size exceeds the minCoursesRequired, unless min is 0.
    if (row.getMinCoursesRequired() > 0 && matches.size() > row.getMinCoursesRequired()) {
      return new ArrayList<>(matches.subList(0, row.getMinCoursesRequired()));
    }

    return matches;
  }

  /**
   * Matches user courses against a list of patterns (regex).
   *
   * @param row The RequirementRow containing the patterns and min courses required.
   * @return A list of courses that matched the patterns.
   */
  private List<String> matchPattern(RequirementRow row) {
    List<String> matches = new ArrayList<>();
    boolean isCapstone = "Capstone".equalsIgnoreCase(row.getCategoryName());

    for (String course : userCourses) {
      if ((isCapstone || !usedCourses.contains(course))
          && row.getAcceptedCourses().stream()
          .anyMatch(pattern -> course.matches(convertPatternToRegex(pattern)))) {
        matches.add(course);
        if (!isCapstone) {
          usedCourses.add(course);
        }
        if (matches.size() >= row.getMinCoursesRequired()) {
          break;
        }
      }
    }
    return matches;
  }

  /**
   * Matches courses from a previously processed category.
   *
   * @param row The RequirementRow specifying the source category.
   * @return A list of courses matched in the source category.
   */
  private List<String> matchFromCategory(RequirementRow row) {
    if (row.getAcceptedCourses().isEmpty()) {
      System.err.println(
          "Error: 'from_category' rule '" + row.getCategoryName() + "' missing source category.");
      return new ArrayList<>();
    }

    String sourceCategoryName = row.getAcceptedCourses().get(0);
    List<String> sourceMatches =
        intermediateResults.getOrDefault(sourceCategoryName, new ArrayList<>());

    List<String> matchedCourses = new ArrayList<>();
    for (String course : sourceMatches) {
      // This check ensures courses already consumed by their primary category are not re-counted
      // here.
      // This aligns with "should not be counted again for Elective: Extra Systems"
      if (!usedCourses.contains(course)) {
        matchedCourses.add(course);
        // Do NOT add to usedCourses here, as these courses are consumed by their original category.
        // If they were added here, it would double-count them for 'usedCourses' tracking.
        // 'from_category' typically reuses the *identification* of courses, not consume them again
        // for usedCourses.
        if (matchedCourses.size() >= row.getMinCoursesRequired()) {
          break;
        }
      }
    }
    return matchedCourses;
  }

  /**
   * Computes the total number of unique elective courses satisfied across all categories that start
   * with "Elective:".
   *
   * @param row The RequirementRow for the elective total.
   * @return A list of all unique elective courses counted towards the total.
   */
  private List<String> computeElectiveTotal(RequirementRow row) {
    Set<String> electivesUsed = new HashSet<>();

    for (Map.Entry<String, List<String>> entry : intermediateResults.entrySet()) {
      String category = entry.getKey();
      if (category.startsWith("Elective:") && !category.equals(row.getCategoryName())) {
        electivesUsed.addAll(entry.getValue());
      }
    }

    if (electivesUsed.size() < row.getMinCoursesRequired()) {
      System.out.println(
          "Warning: user does not meet total electives requirement for category: "
              + row.getCategoryName()
              + ". Required: "
              + row.getMinCoursesRequired()
              + ", Found: "
              + electivesUsed.size());
    }

    return new ArrayList<>(electivesUsed);
  }

  /**
   * Counts the total number of unique courses completed across all requirements.
   *
   * @param requirementResults The map of requirement categories to matched courses.
   * @return The total count of unique completed courses.
   */
  public int countCoursesCompleted(Map<String, List<String>> requirementResults) {
    Set<String> allCompletedCourses = new HashSet<>();
    for (List<String> courses : requirementResults.values()) {
      allCompletedCourses.addAll(courses);
    }
    return allCompletedCourses.size();
  }

  /**
   * Calculates the total number of courses required for the concentration. This sums up
   * `minCoursesRequired` for all requirements, dynamically adjusting for conditional overrides.
   *
   * @return The total number of courses required.
   */
  public int getTotalCoursesRequired() {
    int total = 0;
    Set<String> categoriesConsideredForTotal =
        new HashSet<>(); // To avoid double counting categories in conditional logic

    for (RequirementRow row :
        requirements.values()) { // Iterate over values() because 'requirements' is a Map
      String categoryName = row.getCategoryName();
      String ruleType = row.getRuleType();

      // Skip rules that don't directly contribute to the total or are handled conditionally
      if ("elective_total".equals(ruleType) || "conditional_path".equals(ruleType)) {
        continue;
      }

      // If this category is overridden by an active conditional path, skip it for the default sum
      if (categoriesToSkip.contains(categoryName)) {
        continue;
      }

      // If this category is an *alternative* that was activated, and its *overridden* counterpart
      // hasn't been added yet,
      // it will be added when we iterate through `activeCategoryAlternatives`.
      // We explicitly check if it's a value in activeCategoryAlternatives
      if (activeCategoryAlternatives.containsValue(categoryName)) {
        // This ensures we count the correct path (either original or alternative) once.
        // If a category is an alternative for an active conditional, it will be handled
        // when we sum up activeCategoryAlternatives below. So, skip it in this main loop.
        boolean skipThisInMainLoop = false;
        for (Map.Entry<String, String> entry : activeCategoryAlternatives.entrySet()) {
          if (entry.getValue().equals(categoryName) && categoriesToSkip.contains(entry.getKey())) {
            skipThisInMainLoop = true;
            break;
          }
        }
        if (skipThisInMainLoop) {
          continue;
        }
      }

      // Add to total only if it hasn't been explicitly excluded
      if (!categoriesConsideredForTotal.contains(categoryName)) {
        total += row.getMinCoursesRequired();
        categoriesConsideredForTotal.add(categoryName);
      }
    }

    // Now, add the minCoursesRequired for the actively chosen alternative categories
    // Ensure we don't double count if the alternative was already part of the initial sum
    for (String altCategoryName : activeCategoryAlternatives.values()) {
      RequirementRow altRow =
          requirements.get(altCategoryName); // Use .get() because 'requirements' is a Map
      if (altRow != null && !categoriesConsideredForTotal.contains(altCategoryName)) {
        total += altRow.getMinCoursesRequired();
        categoriesConsideredForTotal.add(altCategoryName);
      }
    }

    return total;
  }

  private String convertPatternToRegex(String pattern) {
    // Escapes special regex characters if they are part of the literal course name
    // and then replaces 'xxx' with digits.
    // Example: "CSCI 2xxx" -> "CSCI 2\d{3,4}"
    String escapedPattern = Pattern.quote(pattern); // Escapes literal characters
    return escapedPattern.replace("xxx", "\\E\\d{3,4}\\Q"); // \\E and \\Q for literal block
  }
}

//package edu.brown.cs.student.main.server.googleSheetsRequirements;
//
//import edu.brown.cs.student.main.server.storage.StorageInterface;
//import java.util.ArrayList;
//import java.util.HashMap;
//import java.util.HashSet;
//import java.util.LinkedHashMap;
//import java.util.List;
//import java.util.Map;
//import java.util.Set;
//import java.util.regex.Pattern;
//import java.util.stream.Collectors;
//
//public class RequirementChecker {
//  // CRITICAL FIX: Change from List to Map for requirements for direct lookup
//  private final Map<String, RequirementRow> requirements;
//  private final Set<String> userCourses;
//  private final Set<String> usedCourses =
//      new HashSet<>(); // Tracks courses used across all categories
//  private final StorageInterface storageHandler; // Kept as placeholder
//  private final String uid; // Kept as placeholder
//
//  // To store intermediate results for use by 'from_category' and 'elective_total'
//  private final Map<String, List<String>> intermediateResults = new LinkedHashMap<>();
//  // NEW: To track which standard categories should be skipped due to an active conditional path
//  private final Set<String> categoriesToSkip = new HashSet<>();
//  // NEW: To store the active alternative categories that need to be processed
//  // Maps the category being overridden to its active alternative (e.g., "Intro Part 2 Standard" ->
//  // "Intro Part 2 - Alt")
//  private final Map<String, String> activeCategoryAlternatives = new HashMap<>();
//
//  // CRITICAL FIX: Constructor signature to match how it's called and how 'requirements' is used
//  public RequirementChecker(
//      Map<String, RequirementRow> requirements, // Now a Map
//      Set<String> userCourses,
//      StorageInterface storageHandler,
//      String uid) {
//    this.requirements = requirements;
//    this.userCourses = userCourses;
//    this.storageHandler = storageHandler;
//    this.uid = uid;
//  }
//
//  /**
//   * Checks all defined concentration requirements against the user's courses.
//   *
//   * @return A map where keys are requirement category names and values are lists of courses that
//   * satisfy that requirement.
//   */
//  public Map<String, List<String>> checkAllRequirements() {
//
//    // PHASE 1: Identify and flag activated conditional paths
//    // Iterate through all requirements to find 'conditional_path' rules first.
//    // Iterate over values() because 'requirements' is now a Map
//    for (RequirementRow row : requirements.values()) {
//      if ("conditional_path".equals(row.getRuleType())) {
//        // Use a special helper that checks for the trigger course without marking it as 'used'.
//        List<String> matchedTriggerCourses = matchCourseListForConditional(row);
//        if (matchedTriggerCourses.size() >= row.getMinCoursesRequired()) {
//          // If this conditional path is active, mark its 'overridesCategory' to be skipped
//          // and store its 'alternativeCategory' for processing later.
//          String overridesCat = row.getOverridesCategory();
//          String alternativeCat = row.getAlternativeCategory();
//
//          if (overridesCat != null && !overridesCat.isEmpty()) { // Ensure not null/empty
//            categoriesToSkip.add(overridesCat);
//          }
//          if (alternativeCat != null && !alternativeCat.isEmpty()) { // Ensure not null/empty
//            // Map the overridden category to its alternative
//            activeCategoryAlternatives.put(overridesCat, alternativeCat);
//          }
//        }
//      }
//    }
//
//    // PHASE 2: Process standard requirements
//    // Exclude 'conditional_path' rules themselves, categories that are overridden by active
//    // conditionals,
//    // and rules that depend on other categories ('from_category', 'elective_total').
//    // Also explicitly exclude any categories that are themselves marked as 'alternativeCategory'
//    // because they will be processed specifically in Phase 3 if their parent conditional is active.
//    // Iterate over values() because 'requirements' is now a Map
//    for (RequirementRow row : requirements.values()) {
//      String categoryName = row.getCategoryName();
//      String ruleType = row.getRuleType();
//      List<String> matched = new ArrayList<>();
//
//      // Skip rules that are:
//      // 1. A conditional_path definition itself.
//      // 2. An 'overridden' category (e.g., "Intro Part 2 Standard" if 0190 was taken).
//      // 3. An 'alternative' category (e.g., "Intro Part 2 - Alt" which will be processed in Phase 3
//      // if needed).
//      // 4. 'from_category' or 'elective_total' (processed in later phases).
//      if ("conditional_path".equals(ruleType)
//          || categoriesToSkip.contains(categoryName)
//          || activeCategoryAlternatives.containsValue(categoryName)
//          || // Check if this category is an *alternative* for any active conditional
//          "from_category".equals(ruleType)
//          || "elective_total".equals(ruleType)) {
//        continue;
//      }
//
//      switch (ruleType) {
//        case "course_list":
//          matched = matchCourseList(row);
//          break;
//        case "pattern_match":
//          matched = matchPattern(row);
//          break;
//        default:
//          // Handle other specific rule types here if they are simple and not conditional
//          // It's good practice to log or throw an error for unhandled types
//          System.err.println(
//              "Warning: Unhandled rule type for category: "
//                  + categoryName
//                  + " with type "
//                  + ruleType);
//          break;
//      }
//      intermediateResults.put(categoryName, matched);
//    }
//
//    // PHASE 3: Process the active alternative categories
//    // This loop iterates through the *values* of activeCategoryAlternatives, which are the names
//    // of the alternative categories that need to be processed.
//    for (String alternativeCategoryName :
//        new HashSet<>(
//            activeCategoryAlternatives.values())) { // Use HashSet to avoid processing duplicates
//      RequirementRow altRow =
//          requirements.get(alternativeCategoryName); // Use .get() because 'requirements' is a Map
//      if (altRow != null) {
//        List<String> matchedAlt = new ArrayList<>();
//        switch (altRow.getRuleType()) {
//          case "course_list":
//            matchedAlt = matchCourseList(altRow);
//            break;
//          case "pattern_match":
//            matchedAlt = matchPattern(altRow);
//            break;
//          // Add other rule types if your alternative categories can be of those types
//          default:
//            System.err.println(
//                "Warning: Unhandled rule type for alternative category: "
//                    + altRow.getCategoryName()
//                    + " with type "
//                    + altRow.getRuleType());
//            break;
//        }
//        intermediateResults.put(altRow.getCategoryName(), matchedAlt);
//      }
//    }
//
//    // PHASE 4: Process 'from_category' which depends on other categories being processed
//    // This pass needs to happen after all source categories (including conditional ones) are
//    // processed.
//    // Iterate over values() because 'requirements' is now a Map
//    for (RequirementRow row : requirements.values()) {
//      if (row.getRuleType().equals("from_category")) {
//        List<String> matched = matchFromCategory(row);
//        intermediateResults.put(row.getCategoryName(), matched);
//      }
//    }
//
//    // PHASE 5: Final pass/calculation: Process 'elective_total'
//    // This must happen after all individual elective categories are processed.
//    // Iterate over values() because 'requirements' is now a Map
//    for (RequirementRow row : requirements.values()) {
//      if (row.getRuleType().equals("elective_total")) {
//        List<String> matched = computeElectiveTotal(row);
//        intermediateResults.put(row.getCategoryName(), matched);
//        break; // Assuming only one "Electives (Total)" rule
//      }
//    }
//
//    return intermediateResults;
//  }
//
//  /**
//   * Helper method to match user courses against a list for conditional triggers. IMPORTANT: This
//   * method does NOT add courses to the 'usedCourses' set, as the trigger course might also fulfill
//   * another requirement.
//   *
//   * @param row The RequirementRow containing the course list for the condition.
//   * @return A list of courses that matched the trigger, without marking them as used.
//   */
//  private List<String> matchCourseListForConditional(RequirementRow row) {
//    List<String> matches = new ArrayList<>();
//    // Do NOT check against usedCourses, and do NOT add to usedCourses
//    for (String course : userCourses) {
//      if (row.getAcceptedCourses().contains(course)) {
//        matches.add(course);
//        if (matches.size() >= row.getMinCoursesRequired()) {
//          break;
//        }
//      }
//    }
//    return matches;
//  }
//
//  /**
//   * Matches user courses against a list of accepted courses.
//   *
//   * @param row The RequirementRow containing the course list and min courses required.
//   * @return A list of courses that matched.
//   */
//  private List<String> matchCourseList(RequirementRow row) {
//    List<String> matches = new ArrayList<>();
//    boolean isCapstone = "Capstone".equalsIgnoreCase(row.getCategoryName());
//
//    for (String course : row.getAcceptedCourses()) {
//      if (userCourses.contains(course) && (isCapstone || !usedCourses.contains(course))) {
//        matches.add(course);
//        if (!isCapstone) { // Capstone courses are not added to `usedCourses` for general
//          // consumption
//          usedCourses.add(course);
//        }
//        if (matches.size() >= row.getMinCoursesRequired()) {
//          break;
//        }
//      }
//    }
//
//    // Handle substitutions if not enough courses are matched
//    if (matches.size() < row.getMinCoursesRequired() && row.getSubstitutions() != null) {
//      for (String sub : row.getSubstitutions()) {
//        if (userCourses.contains(sub) && (isCapstone || !usedCourses.contains(sub))) {
//          matches.add(sub);
//          if (!isCapstone) {
//            usedCourses.add(sub);
//          }
//          if (matches.size() >= row.getMinCoursesRequired()) {
//            break;
//          }
//        }
//      }
//    }
//    return matches;
//  }
//
//  /**
//   * Matches user courses against a list of patterns (regex).
//   *
//   * @param row The RequirementRow containing the patterns and min courses required.
//   * @return A list of courses that matched the patterns.
//   */
//  private List<String> matchPattern(RequirementRow row) {
//    List<String> matches = new ArrayList<>();
//    boolean isCapstone = "Capstone".equalsIgnoreCase(row.getCategoryName());
//
//    for (String course : userCourses) {
//      if ((isCapstone || !usedCourses.contains(course))
//          && row.getAcceptedCourses().stream()
//          .anyMatch(pattern -> course.matches(convertPatternToRegex(pattern)))) {
//        matches.add(course);
//        if (!isCapstone) {
//          usedCourses.add(course);
//        }
//        if (matches.size() >= row.getMinCoursesRequired()) {
//          break;
//        }
//      }
//    }
//    return matches;
//  }
//
//  /**
//   * Matches courses from a previously processed category.
//   *
//   * @param row The RequirementRow specifying the source category.
//   * @return A list of courses matched in the source category.
//   */
//  private List<String> matchFromCategory(RequirementRow row) {
//    if (row.getAcceptedCourses().isEmpty()) {
//      System.err.println(
//          "Error: 'from_category' rule '" + row.getCategoryName() + "' missing source category.");
//      return new ArrayList<>();
//    }
//
//    String sourceCategoryName = row.getAcceptedCourses().get(0);
//    List<String> sourceMatches =
//        intermediateResults.getOrDefault(sourceCategoryName, new ArrayList<>());
//
//    List<String> matchedCourses = new ArrayList<>();
//    for (String course : sourceMatches) {
//      if (!usedCourses.contains(course)) {
//        matchedCourses.add(course);
//        if (matchedCourses.size() >= row.getMinCoursesRequired()) {
//          break;
//        }
//      }
//    }
//    return matchedCourses;
//  }
//
//  /**
//   * Computes the total number of unique elective courses satisfied across all categories that start
//   * with "Elective:".
//   *
//   * @param row The RequirementRow for the elective total.
//   * @return A list of all unique elective courses counted towards the total.
//   */
//  private List<String> computeElectiveTotal(RequirementRow row) {
//    Set<String> electivesUsed = new HashSet<>();
//
//    for (Map.Entry<String, List<String>> entry : intermediateResults.entrySet()) {
//      String category = entry.getKey();
//      if (category.startsWith("Elective:") && !category.equals(row.getCategoryName())) {
//        electivesUsed.addAll(entry.getValue());
//      }
//    }
//
//    if (electivesUsed.size() < row.getMinCoursesRequired()) {
//      System.out.println(
//          "Warning: user does not meet total electives requirement for category: "
//              + row.getCategoryName()
//              + ". Required: "
//              + row.getMinCoursesRequired()
//              + ", Found: "
//              + electivesUsed.size());
//    }
//
//    return new ArrayList<>(electivesUsed);
//  }
//
//  /**
//   * Counts the total number of unique courses completed across all requirements.
//   *
//   * @param requirementResults The map of requirement categories to matched courses.
//   * @return The total count of unique completed courses.
//   */
//  public int countCoursesCompleted(Map<String, List<String>> requirementResults) {
//    Set<String> allCompletedCourses = new HashSet<>();
//    for (List<String> courses : requirementResults.values()) {
//      allCompletedCourses.addAll(courses);
//    }
//    return allCompletedCourses.size();
//  }
//
//  /**
//   * Calculates the total number of courses required for the concentration,
//   * only including rows that have a display name.
//   *
//   * @return The total number of courses required.
//   */
//  public int getTotalCoursesRequired() {
//    int total = 0;
//    for (RequirementRow row : requirements.values()) {
//      // Only count rows that have a display name
//      if (row.getDisplayName() != null && !row.getDisplayName().isEmpty()) {
//        total += row.getMinCoursesRequired();
//      }
//    }
//    return total;
//  }
//
//  private String convertPatternToRegex(String pattern) {
//    String escapedPattern = Pattern.quote(pattern);
//    return escapedPattern.replace("xxx", "\\E\\d{3,4}\\Q");
//  }
//}