import java.util.Map;

public class CourseInfo {
  private String courseName;
  private Map<String, CourseSemesterInfo> semesterToTreeMap; // semester → tree ID or null

  public CourseInfo(String courseName, Map<String, CourseSemesterInfo> semesterToTreeMap) {
    this.courseName = courseName;
    this.semesterToTreeMap = semesterToTreeMap;
  }

  public String getCourseName() {
    return courseName;
  }

  public Map<String, CourseSemesterInfo> getSemesterToTreeMap() {
    return semesterToTreeMap;
  }

  public CourseSemesterInfo getSemesterInfo(String semester) {
    return semesterToTreeMap.get(semester);
  }
}
