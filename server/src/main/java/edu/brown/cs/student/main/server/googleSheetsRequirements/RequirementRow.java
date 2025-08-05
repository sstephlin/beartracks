package edu.brown.cs.student.main.server.googleSheetsRequirements;

import java.util.List;

// Represents each row of the spreadsheet, for the new requirement checker implementation
public class RequirementRow {
  private final String categoryName;
  private final String displayName;
  private final String ruleType;
  private final List<String> acceptedCourses; // This will hold course lists or patterns
  private final int minCoursesRequired;
  private final Integer maxUses;
  private final List<String> substitutions;
  private final String alternativeCategory;
  private final String overridesCategory;

  public RequirementRow(
      String categoryName,
      String displayName,
      String ruleType,
      List<String> acceptedCourses,
      int minCoursesRequired,
      Integer maxUses,
      List<String> substitutions,
      String alternativeCategory,
      String overridesCategory) {
    this.categoryName = categoryName;
    this.displayName = displayName;
    this.ruleType = ruleType;
    this.acceptedCourses = acceptedCourses;
    this.minCoursesRequired = minCoursesRequired;
    this.maxUses = maxUses;
    this.substitutions = substitutions;
    this.alternativeCategory = alternativeCategory;
    this.overridesCategory = overridesCategory;
  }

  public String getCategoryName() {
    return categoryName;
  }

  public String getDisplayName() {
    return displayName;
  }

  public String getRuleType() {
    return ruleType;
  }

  public List<String> getAcceptedCourses() {
    return acceptedCourses;
  }

  public int getMinCoursesRequired() {
    return minCoursesRequired;
  }

  public Integer getMaxUses() {
    return maxUses;
  }

  public List<String> getSubstitutions() {
    return substitutions;
  }

  public String getAlternativeCategory() {
    return alternativeCategory;
  }

  public String getOverridesCategory() {
    return overridesCategory;
  }
}
