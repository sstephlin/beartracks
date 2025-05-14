package edu.brown.cs.student.main.server.storage;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * This edu.brown.cs.student.main.server.storage.MockStorageInterface class can be instantiated in
 * unit tests in test classes to mock the getter methods that StorageInterface relies on This
 * edu.brown.cs.student.main.server.storage.MockStorageInterface class can be instantiated in unit
 * tests in test classes to mock the getter methods that StorageInterface relies on
 */
public class MockStorageInterface implements StorageInterface {

  private final String concentration;
  private final Set<String> userCourses;
  private final String capstoneCourse;

  /**
   * constructor for a mock stoage interface to mock the getter methods in StorageInterface
   *
   * @param concentration - a user's concentration
   * @param userCourses - all the courses a user has taken/plans to take (AKA added to their course
   *     plan)
   * @param capstoneCourse - a user's selected capstone course
   */
  public MockStorageInterface(
      String concentration, Set<String> userCourses, String capstoneCourse) {
    this.concentration = concentration;
    this.userCourses = userCourses;
    this.capstoneCourse = capstoneCourse;
  }

  /**
   * getter method for returning a user's concentration
   *
   * @param userId - user's id in firestore
   * @return a user's concentration
   */
  @Override
  public String getConcentration(String userId) {
    return this.concentration;
  }

  /**
   * getter method for returning a user's courses as a set
   *
   * @param userId - user's id in firestore
   * @return a user's courses as a set
   */
  @Override
  public Set<String> getAllUserCourses(String userId) {
    return this.userCourses;
  }

  /**
   * getter method for returning a user's capstone course
   *
   * @param userId - user's id in firestore
   * @return a user's capstone course
   */
  @Override
  public String getCapstoneCourse(String userId) {
    return this.capstoneCourse;
  }

  /**
   * getter method for returning if the user last selected to view 2 or 4 semesters at a time
   *
   * @param uid
   * @return either 2 or 4, as strings
   */
  // setter methods that write to/modify firestore will not be mocked!
  @Override
  public String getView(String uid) {
    throw new UnsupportedOperationException("Not used in test");
  }

  @Override
  public String getExpanded(String uid) {
    throw new UnsupportedOperationException("Not used in test");
  }

  @Override
  public void addDocument(
      String uid, String collection_id, String doc_id, Map<String, Object> data) {
    throw new UnsupportedOperationException("Not used in test");
  }

  @Override
  public void deleteDocument(com.google.cloud.firestore.DocumentReference doc) {
    throw new UnsupportedOperationException("Not used in test");
  }

  @Override
  public Map<String, List<String>> getAllSemestersAndCourses(String uid) {
    throw new UnsupportedOperationException("Not used in test");
  }

  @Override
  public Map<String, List<Map<String, Object>>> getAllSemestersAndCourses(
      String uid, boolean includeTitle) {
    throw new UnsupportedOperationException("Not used in test");
  }

  @Override
  public void updateIsCapstoneField(
      String uid, String semester, String courseCode, Boolean isCapstone) {
    throw new UnsupportedOperationException("Not used in test");
  }

  @Override
  public void updatePrereqsMet(String uid, String semester, String courseCode, boolean prereqsMet) {
    throw new UnsupportedOperationException("Not used in test");
  }

  @Override
  public String findSemesterOfCapstone(String uid, String courseCode) {
    throw new UnsupportedOperationException("Not used in test");
  }
}
