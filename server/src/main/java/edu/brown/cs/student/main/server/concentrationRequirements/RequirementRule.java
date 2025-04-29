package edu.brown.cs.student.main.server.concentrationRequirements;

import java.util.List;

/**
 * object that represents each category of requirements
 */
public class RequirementRule {
  private List<String> acceptableCourses; // List of acceptable course groups
  private int howManyNeeded; // how many courses  of groups the user must satisfy
  private List<String> substitutions; // Substitution courses allowed (optional)

  // Constructor
  public RequirementRule(List<String> acceptableCourses, int howManyNeeded, List<String> substitutions) {
    this.acceptableCourses = acceptableCourses;
    this.howManyNeeded = howManyNeeded;
    this.substitutions = substitutions;
  }

  // Getters
  public List<String> getAcceptableCourses() {
    return acceptableCourses;
  }

  public int getHowManyNeeded() {
    return howManyNeeded;
  }

  public List<String> getSubstitutions() {
    return substitutions;
  }
}


