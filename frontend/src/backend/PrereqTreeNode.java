import java.util.*;

public class PrereqTreeNode {
  public enum NodeType {
    AND, OR, COURSE
  }

  private NodeType type;
  private List<PrereqTreeNode> children;
  private String course; // only used if type == COURSE

  public PrereqTreeNode(NodeType type) {
    this.type = type;
    this.children = new ArrayList<>();
  }

  public PrereqTreeNode(String course) {
    this.type = NodeType.COURSE;
    this.course = course;
    this.children = new ArrayList<>();
  }

  public void addChild(PrereqTreeNode child) {
    if (type != NodeType.COURSE) {
      children.add(child);
    }
  }

  public NodeType getType() { return type; }
  public List<PrereqTreeNode> getChildren() { return children; }
  public String getCourse() { return course; }
}
