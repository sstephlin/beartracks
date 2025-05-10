package edu.brown.cs.student.main.server.parser;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
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

  public PrereqTreeNode getPrereqTree(String courseCode, String semesterKey) {
    CourseInfo courseInfo = courseMap.get(courseCode);
    if (courseInfo == null) return null;

    String treeId = courseInfo.semesterToTreeId.get(semesterKey);
    if (treeId == null) return null;

    return treeMap.get(treeId);
  }

  private List<String> extractCoursesFromTree(PrereqTreeNode node) {
    List<String> courses = new ArrayList<>();

    if (node.type == PrereqTreeNode.Type.COURSE) {
      courses.add(node.courseCode);
    } else if (node.children != null) {
      for (PrereqTreeNode child : node.children) {
        courses.addAll(extractCoursesFromTree(child));
      }
    }

    return courses;
  }
}
