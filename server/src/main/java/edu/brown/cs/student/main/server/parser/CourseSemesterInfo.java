public class CourseSemesterInfo {
  private String prereqTreeId; // null if no prereqs or unknown

  public CourseSemesterInfo(String prereqTreeId) {
    this.prereqTreeId = prereqTreeId;
  }

  public String getPrereqTreeId() {
    return prereqTreeId;
  }

  public void setPrereqTreeId(String prereqTreeId) {
    this.prereqTreeId = prereqTreeId;
  }

  @Override
  public String toString() {
    return "CourseSemesterInfo{prereqTreeId='" + prereqTreeId + "'}";
  }
}

