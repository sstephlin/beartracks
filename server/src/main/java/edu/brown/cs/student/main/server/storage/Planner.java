// package edu.brown.cs.student.main.server.storage;
//
// import edu.brown.cs.student.main.server.parser.CourseCatalog;
// import edu.brown.cs.student.main.server.parser.CourseInfo;
// import edu.brown.cs.student.main.server.parser.PrereqTreeNode;
// import java.util.*;
//
// public class Planner {
//  private final TreeMap<SemesterKey, Semester> semesterMap = new TreeMap<>();
//  private final CourseCatalog catalog;
//
//  public Planner(CourseCatalog catalog) {
//    this.catalog = catalog;
//  }
//
//  public void addSemester(SemesterKey key, Semester semester) {
//    semesterMap.put(key, semester);
//  }
//
//  public void removeSemester(SemesterKey key) {
//    semesterMap.remove(key);
//  }
//
//  public List<Semester> getSemestersInOrder() {
//    return new ArrayList<>(semesterMap.values());
//  }
//
//  public boolean canAddCourse(SemesterKey targetKey, String courseCode) {
//    CourseInfo info = catalog.courseMap.get(courseCode);
//    if (info == null) return false;
//
//    String semKey = targetKey.toString();
//    String treeId = info.semesterToTreeId.get(semKey);
//    if (treeId == null) return true;
//
//    PrereqTreeNode prereqTree = catalog.treeMap.get(treeId);
//    Set<String> completedCourses = getCompletedCoursesBefore(targetKey);
//
//    return evaluateTree(prereqTree, completedCourses);
//  }
//
//  private Set<String> getCompletedCoursesBefore(SemesterKey beforeKey) {
//    Set<String> completed = new HashSet<>();
//    for (Map.Entry<SemesterKey, Semester> entry : semesterMap.entrySet()) {
//      if (entry.getKey().compareTo(beforeKey) >= 0) break;
//      for (Course c : entry.getValue().getCourses()) {
//        completed.add(c.getCode());
//      }
//    }
//    return completed;
//  }
//
//  private boolean evaluateTree(PrereqTreeNode node, Set<String> completed) {
//    switch (node.type) {
//      case COURSE:
//        return completed.contains(node.courseCode);
//      case AND:
//        for (PrereqTreeNode child : node.children) {
//          if (!evaluateTree(child, completed)) return false;
//        }
//        return true;
//      case OR:
//        for (PrereqTreeNode child : node.children) {
//          if (evaluateTree(child, completed)) return true;
//        }
//        return false;
//    }
//    return false;
//  }
// }
