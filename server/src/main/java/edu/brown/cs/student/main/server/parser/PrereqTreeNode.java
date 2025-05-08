package edu.brown.cs.student.main.server.parser;

import java.util.ArrayList;
import java.util.List;

public class PrereqTreeNode {
  public enum Type {
    AND,
    OR,
    COURSE
  }

  public Type type;
  public List<PrereqTreeNode> children;
  public String courseCode;
  public Boolean isConcurrent;

  // For internal nodes (AND/OR)
  public PrereqTreeNode(Type type) {
    this.type = type;
    this.children = new ArrayList<>();
  }

  // For leaf course node
  public PrereqTreeNode(String courseCode, boolean isConcurrent) {
    this.type = Type.COURSE;
    this.courseCode = courseCode;
    this.isConcurrent = isConcurrent;
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

  public boolean isLeaf() {
    return this.type == Type.COURSE;
  }

  public boolean isEmpty() {
    return this.type != Type.COURSE && (children == null || children.isEmpty());
  }

  public String getValue() {
    return this.courseCode;
  }
}
