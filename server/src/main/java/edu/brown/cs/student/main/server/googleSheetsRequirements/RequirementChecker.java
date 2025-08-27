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
  private final Map<String, RequirementRow> requirements;
  private final Set<String> userCourses;
  private final Set<String> usedCourses =
      new HashSet<>(); // Tracks courses used across all categories
  private final StorageInterface storageHandler; // Kept as placeholder
  private final String uid; // Kept as placeholder
  private final String userDesignatedCapstone;

  // To store intermediate results for use by 'from_category' and 'elective_total'
  private final Map<String, List<String>> intermediateResults = new LinkedHashMap<>();
  // NEW: To track which standard categories should be skipped due to an active conditional path
  private final Set<String> categoriesToSkip = new HashSet<>();
  // NEW: To store the active alternative categories that need to be processed
  // Maps the category being overridden to its active alternative (e.g., "Intro Part 2 Standard" ->
  // "Intro Part 2 - Alt")
  private final Map<String, String> activeCategoryAlternatives = new HashMap<>();
  private final Map<String, Integer> categoryUsageCounts = new HashMap<>();

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
    this.userDesignatedCapstone = storageHandler.getCapstoneCourse(uid);
  }

  /**
   * Checks all defined concentration requirements against the user's courses.
   *
   * @return A map where keys are requirement category names and values are lists of courses that
   * satisfy that requirement.
   */
  public Map<String, List<String>> checkAllRequirements() {
    System.out.println("=== START checkAllRequirements ===");
    System.out.println("Initial userCourses: " + userCourses);
    System.out.println("Initial usedCourses: " + usedCourses);

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
  /**
   * Matches user courses against a list of accepted courses.
   *
   * @param row The RequirementRow containing the course list and min courses required.
   * @return A list of courses that matched.
   */
  private List<String> matchCourseList(RequirementRow row) {
    List<String> matches = new ArrayList<>();
    String categoryName = row.getCategoryName();
    boolean isCapstone = "Capstone".equalsIgnoreCase(categoryName);

    Integer maxUsesObj = row.getMaxUses();
    int maxUses = (maxUsesObj == null) ? -1 : maxUsesObj.intValue();

    for (String course : userCourses) {
      // For capstone: only match courses explicitly designated by user
      if (isCapstone) {
        if (userDesignatedCapstone == course &&
            row.getAcceptedCourses().contains(course)) {
          matches.add(course);
          // Don't mark capstone courses as "used" so they can count for other requirements too
          if (matches.size() >= row.getMinCoursesRequired()) {
            break;
          }
        }
      } else {
        // Normal logic for non-capstone courses
        if (row.getAcceptedCourses().contains(course)) {
          int currentUsage = categoryUsageCounts.getOrDefault(categoryName, 0);

          if (maxUses > 0 && currentUsage >= maxUses) {
            break;
          }

          if (!usedCourses.contains(course)) {
            matches.add(course);
            usedCourses.add(course);
            categoryUsageCounts.put(categoryName, currentUsage + 1);

            if (matches.size() >= row.getMinCoursesRequired()) {
              break;
            }
          }
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
   * Counts the total number of unique courses completed across requirements that contribute to the total.
   * Only counts courses from categories where minCoursesRequired > 0 and excludes conditional_path rules.
   *
   * @param requirementResults The map of requirement categories to matched courses.
   * @return The total count of unique completed courses that count toward the concentration.
   */
  public int countCoursesCompleted(Map<String, List<String>> requirementResults) {
    Set<String> allCompletedCourses = new HashSet<>();

    for (Map.Entry<String, List<String>> entry : requirementResults.entrySet()) {
      String categoryName = entry.getKey();
      List<String> courses = entry.getValue();

      // Get the requirement row for this category
      RequirementRow row = requirements.get(categoryName);
      if (row == null) {
        continue; // Skip if we can't find the requirement
      }

      // Only count courses from categories that contribute to the total
      if (shouldCountTowardTotal(row, categoryName)) {
        allCompletedCourses.addAll(courses);
      }
    }

    return allCompletedCourses.size();
  }

  /**
   * Helper method to determine if a requirement category should count toward the total.
   * Uses the same logic as getTotalCoursesRequired() to ensure consistency.
   */
  private boolean shouldCountTowardTotal(RequirementRow row, String categoryName) {
    String ruleType = row.getRuleType();
    int minRequired = row.getMinCoursesRequired();

    // Skip conditional_path rules
    if ("conditional_path".equals(ruleType)) {
      return false;
    }

    // Skip requirements with 0 or negative min courses (like Calculus, Capstone)
    if (minRequired <= 0) {
      return false;
    }

    // Skip categories that are overridden by active conditional paths
    if (categoriesToSkip.contains(categoryName)) {
      return false;
    }

    // Skip inactive alternative categories
    if (isAlternativeCategory(categoryName) && !activeCategoryAlternatives.containsValue(categoryName)) {
      return false;
    }

    return true;
  }

  /**
   * Helper method to determine if a category name represents an alternative category.
   * This can be customized based on your naming conventions.
   */
  private boolean isAlternativeCategory(String categoryName) {
    // Based on your spreadsheet, alternative categories seem to have "Alternative" or "Alt" in the name
    return categoryName != null &&
        (categoryName.toLowerCase().contains("alternative") ||
            categoryName.toLowerCase().contains(" - alt"));
  }

  /**
   * Calculates the total number of courses required for the concentration. This sums up
   * `minCoursesRequired` for all requirements, dynamically adjusting for conditional overrides.
   * Only counts categories where minCoursesRequired > 0.
   * Excludes conditional_path rules and alternative categories that aren't active.
   *
   * @return The total number of courses required.
   */
  public int getTotalCoursesRequired() {
    int total = 0;
    Set<String> categoriesConsideredForTotal = new HashSet<>();

    for (RequirementRow row : requirements.values()) {
      String categoryName = row.getCategoryName();
      String ruleType = row.getRuleType();
      int minRequired = row.getMinCoursesRequired();

      // SKIP: conditional_path rules (they don't contribute to total, they just activate alternatives)
      if ("conditional_path".equals(ruleType)) {
        continue;
      }

      // SKIP: Requirements with 0 or negative min courses (like Calculus, Capstone with 0)
      if (minRequired <= 0) {
        continue;
      }

      // SKIP: Categories that are overridden by active conditional paths
      if (categoriesToSkip.contains(categoryName)) {
        continue;
      }

      // SKIP: Alternative categories that are NOT currently active
      // (We'll add active alternatives in the next loop)
      if (isAlternativeCategory(categoryName) && !activeCategoryAlternatives.containsValue(
          categoryName)) {
        continue;
      }

      // SKIP: Alternative categories in this main loop (we handle them separately below)
      if (activeCategoryAlternatives.containsValue(categoryName)) {
        continue;
      }

      // Add to total if it passes all checks and hasn't been counted yet
      if (!categoriesConsideredForTotal.contains(categoryName)) {
        total += minRequired;
        categoriesConsideredForTotal.add(categoryName);
      } else {
      }
    }

    // Add the minCoursesRequired for the actively chosen alternative categories
    for (String altCategoryName : activeCategoryAlternatives.values()) {
      RequirementRow altRow = requirements.get(altCategoryName);
      if (altRow != null && !categoriesConsideredForTotal.contains(altCategoryName)) {
        int altMinRequired = altRow.getMinCoursesRequired();
        if (altMinRequired > 0) {  // Only add if > 0
          total += altMinRequired;
          categoriesConsideredForTotal.add(altCategoryName);

        } else {

        }
      }
    }

    return total;
  }

  private String convertPatternToRegex(String pattern) {
    // Split by comma and process each pattern separately
    String[] patterns = pattern.split(",\\s*");
    StringBuilder regexBuilder = new StringBuilder();

    for (int i = 0; i < patterns.length; i++) {
      String singlePattern = patterns[i].trim();
      String escapedPattern = Pattern.quote(singlePattern);
      String regexPattern = escapedPattern.replace("xxx", "\\E\\d{3,4}[A-Za-z]*\\Q");

      regexBuilder.append("(").append(regexPattern).append(")");

      if (i < patterns.length - 1) {
        regexBuilder.append("|"); // OR operator between patterns
      }
    }

    return regexBuilder.toString();
  }

  private List<String> matchPattern(RequirementRow row) {
    List<String> matches = new ArrayList<>();
    System.out.println("Processing pattern for category: " + row.getCategoryName());
    System.out.println("MinCoursesRequired: " + row.getMinCoursesRequired());
    System.out.println("Pattern: " + row.getAcceptedCourses());
    System.out.println("All userCourses: " + userCourses);
    System.out.println("UsedCourses at start: " + usedCourses);

    boolean isCapstone = "Capstone".equalsIgnoreCase(row.getCategoryName());

    for (String course : userCourses) {
      System.out.println("Checking course: " + course + ", already used: " + usedCourses.contains(course));
      boolean courseMatchesPattern = row.getAcceptedCourses().stream()
          .anyMatch(pattern -> course.matches(convertPatternToRegex(pattern)));

      if (isCapstone) {
        // For capstone: only match courses explicitly designated by user
        if (userDesignatedCapstone == course && courseMatchesPattern) {
          matches.add(course);
          // Don't mark as used so it can satisfy other requirements
          if (matches.size() >= row.getMinCoursesRequired()) {
            break;
          }
        }
      } else {
        // Normal logic for non-capstone courses
        if (!usedCourses.contains(course) && courseMatchesPattern) {
          matches.add(course);
          usedCourses.add(course);

          // For elective subcategories, don't break - collect all available matches
          // This allows the elective total to count all matching courses
          boolean isElectiveSubcategory = row.getCategoryName().startsWith("Elective:");

          // Only break for non-elective categories that have actually met their requirement
          if (!isElectiveSubcategory && row.getMinCoursesRequired() > 0 && matches.size() >= row.getMinCoursesRequired()) {
            break;
          }
        }
      }
    }

    System.out.println("Final matches for " + row.getCategoryName() + ": " + matches);

    return matches;
  }
}