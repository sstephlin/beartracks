import java.util.Map;

public class CourseCatalog {
  private Map<String, CourseInfo> courseMap;         // course number → CourseInfo
  private Map<String, PrereqTreeNode> treeMap;       // tree ID → actual tree

  public CourseCatalog(Map<String, CourseInfo> courseMap, Map<String, PrereqTreeNode> treeMap) {
    this.courseMap = courseMap;
    this.treeMap = treeMap;
  }

  public CourseInfo getCourse(String courseNumber) {
    return courseMap.get(courseNumber);
  }

  public PrereqTreeNode getTree(String treeId) {
    return treeMap.get(treeId);
  }

  public Map<String, CourseInfo> getAllCourses() {
    return courseMap;
  }

  public Map<String, PrereqTreeNode> getAllTrees() {
    return treeMap;
  }

  public void addCourse(String courseNumber, CourseInfo info) {
    courseMap.put(courseNumber, info);
  }

  public void addTree(String treeId, PrereqTreeNode tree) {
    treeMap.put(treeId, tree);
  }
}
