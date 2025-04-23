package edu.brown.cs.student.main.server.parser;

import java.util.HashMap;
import java.util.Map;

public class CourseCatalog {
  public Map<String, CourseInfo> courseMap = new HashMap<>();
  public Map<String, PrereqTreeNode> treeMap = new HashMap<>();

  public void addCourse(String courseCode, CourseInfo info) {
    courseMap.put(courseCode, info);
  }

  public void addTree(String treeId, PrereqTreeNode tree) {
    treeMap.put(treeId, tree);
  }
}
