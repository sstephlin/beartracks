package edu.brown.cs.student.main.server.parser;

import java.io.BufferedReader;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.Stack;
import java.util.UUID;

public class CourseCSVParser {

  public static CourseCatalog parse(String filepath) throws IOException {
    CourseCatalog catalog = new CourseCatalog();
    Map<String, String> prereqStringToTreeId = new HashMap<>();

    InputStream is = CourseCSVParser.class.getClassLoader().getResourceAsStream(filepath);
    if (is == null) {
      throw new FileNotFoundException("Resource not found: " + filepath);
    }
    BufferedReader br = new BufferedReader(new InputStreamReader(is));

    // Split header preserving empty columns, include the last semester column
    String header = br.readLine();
    String[] columns = header.split(",", -1);
    String[] semesters = Arrays.copyOfRange(columns, 2, columns.length);

    String line;
    while ((line = br.readLine()) != null) {
      // Preserve trailing empty fields in each row
      String[] tokens = line.split(",(?=([^\"]*\"[^\"]*\")*[^\"]*$)", -1);
      String courseCode = tokens[0];
      String courseName = tokens[1];
      CourseInfo info = new CourseInfo(courseName);

      // Loop through every semester column
      for (int i = 2; i < tokens.length; i++) {
        String cell = tokens[i].trim();
        String semester = semesters[i - 2];

        if (cell.equals("[]")) {
          info.semesterToTreeId.put(semester, null);
        } else if (!cell.isEmpty()) {
          String normalized = cell.replaceAll("\\s+", "");
          if (!prereqStringToTreeId.containsKey(normalized)) {
            String treeId = UUID.randomUUID().toString();
            PrereqTreeNode tree = parseTree(cell);
            if (tree != null) {
              prereqStringToTreeId.put(normalized, treeId);
              catalog.addTree(treeId, tree);
            }
          }
          String reusedId = prereqStringToTreeId.get(normalized);
          info.semesterToTreeId.put(semester, reusedId);
        }
      }
      catalog.addCourse(courseCode, info);
    }
    br.close();
    return catalog;
  }

  private static PrereqTreeNode parseTree(String str) {
    str = str.replaceAll("[\\[\\]\"]", "").trim();
    if (str.isEmpty()) return null;
    if (!str.startsWith("{") && str.contains(",")) {
      str = "{" + str + "}";
    }
    if (str.startsWith("{")) {
      return parseGroup(str);
    } else {
      return new PrereqTreeNode(str);
    }
  }

  private static PrereqTreeNode parseGroup(String str) {
    Stack<PrereqTreeNode> stack = new Stack<>();
    Stack<Character> context = new Stack<>();
    PrereqTreeNode root = new PrereqTreeNode(PrereqTreeNode.Type.AND);
    stack.push(root);

    StringBuilder token = new StringBuilder();
    for (int i = 0; i < str.length(); i++) {
      char ch = str.charAt(i);
      if (ch == '{') {
        PrereqTreeNode group = new PrereqTreeNode(PrereqTreeNode.Type.OR);
        stack.peek().children.add(group);
        stack.push(group);
        context.push('{');
      } else if (ch == '}') {
        if (token.length() > 0) {
          stack.peek().children.add(new PrereqTreeNode(token.toString().trim()));
          token.setLength(0);
        }
        stack.pop();
        context.pop();
      } else if (ch == ',') {
        if (!context.isEmpty() && token.length() > 0) {
          stack.peek().children.add(new PrereqTreeNode(token.toString().trim()));
          token.setLength(0);
        }
      } else {
        token.append(ch);
      }
    }
    if (token.length() > 0 && !stack.isEmpty()) {
      stack.peek().children.add(new PrereqTreeNode(token.toString().trim()));
    }
    return root;
  }
}