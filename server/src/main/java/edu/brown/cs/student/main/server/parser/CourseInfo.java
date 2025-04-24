package edu.brown.cs.student.main.server.parser;

import java.util.HashMap;
import java.util.Map;

public class CourseInfo {
  public String courseName;
  public Map<String, String> semesterToTreeId;

  public CourseInfo(String courseName) {
    this.courseName = courseName;
    this.semesterToTreeId = new HashMap<>();
  }
}
