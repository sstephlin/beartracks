// package edu.brown.cs.student.main.server.storage;
//
// import java.util.*;
//
// public class Semester {
//  private final String name;
//  private final List<Course> courses = new ArrayList<>();
//
//  public Semester(String name) {
//    this.name = name;
//  }
//
//  public void addCourse(Course course) {
//    courses.add(course);
//  }
//
//  public void removeCourse(String courseCode) {
//    courses.removeIf(course -> course.getCode().equals(courseCode));
//  }
//
//  public List<Course> getCourses() {
//    return courses;
//  }
//
//  public String getName() {
//    return name;
//  }
//
//  @Override
//  public String toString() {
//    return name + " - " + courses;
//  }
// }
