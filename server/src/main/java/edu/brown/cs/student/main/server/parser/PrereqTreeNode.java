package edu.brown.cs.student.main.server.parser;
import java.util.ArrayList;
import java.util.List;

public class PrereqTreeNode {
  public enum Type { AND, OR, COURSE }

  public Type type;
  public List<PrereqTreeNode> children;
  public String courseCode;

  public PrereqTreeNode(Type type) {
    this.type = type;
    this.children = new ArrayList<>();
  }

  public PrereqTreeNode(String courseCode) {
    this.type = Type.COURSE;
    this.courseCode = courseCode;
  }

  @Override
  public String toString() {
    if (type == Type.COURSE) return courseCode;
    String joiner = type == Type.AND ? " AND " : " OR ";
    StringBuilder sb = new StringBuilder("(");
    for (int i = 0; i < children.size(); i++) {
      sb.append(children.get(i));
      if (i < children.size() - 1) sb.append(joiner);
    }
    sb.append(")");
    return sb.toString();
  }

  public String toPrettyString(String indent) {
    if (type == Type.COURSE) return indent + "- " + courseCode + "\n";
    StringBuilder sb = new StringBuilder(indent + "- " + type.name() + "\n");
    for (PrereqTreeNode child : children) {
      sb.append(child.toPrettyString(indent + "  "));
    }
    return sb.toString();
  }
}
