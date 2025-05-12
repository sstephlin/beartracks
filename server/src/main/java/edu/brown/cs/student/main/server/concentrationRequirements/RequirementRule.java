package edu.brown.cs.student.main.server.concentrationRequirements;

import java.util.List;

// RequirementRule is an object that represents info about each category of requirements
public class RequirementRule {
  private List<String> acceptableCourses; // List of acceptable course groups
  private int howManyNeeded; // how many courses  of groups the user must satisfy
  private List<String> substitutions; // Substitution courses allowed (optional)

  /**
   * constructor for RequirementRule
   *
   * @param acceptableCourses - list of courses that are accepted for that requirement
   * @param howManyNeeded - number of courses required for that requirement
   * @param substitutions - list of courses that can be accepted in special cases
   */
  public RequirementRule(
      List<String> acceptableCourses, int howManyNeeded, List<String> substitutions) {
    this.acceptableCourses = acceptableCourses;
    this.howManyNeeded = howManyNeeded;
    this.substitutions = substitutions;
  }

  /**
   * getter method for returning acceptable courses for a given requirement category
   *
   * @return list of acceptable courses
   */
  public List<String> getAcceptableCourses() {
    return acceptableCourses;
  }

  /**
   * getter method for returning number of required courses for a given requirement category
   *
   * @return integer value of number of required courses
   */
  public int getHowManyNeeded() {
    return howManyNeeded;
  }

  /**
   * getter method for returning substitution courses for a given requirement category
   *
   * @return list of substitution courses
   */
  public List<String> getSubstitutions() {
    return substitutions;
  }
}
