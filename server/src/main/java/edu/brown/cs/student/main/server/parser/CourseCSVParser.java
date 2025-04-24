package edu.brown.cs.student.main.server.parser;

import java.io.*;
import java.util.*;

public class CourseCSVParser {
  public static void main(String[] args) throws Exception {
    CourseCatalog catalog = new CourseCatalog();
    Map<String, String> prereqStringToTreeId = new HashMap<>();

    BufferedReader br =
        new BufferedReader(
            new FileReader(
                "server/src/main/java/edu/brown/cs/student/main/server/data/mockCourse.csv"));
    String header = br.readLine();
    String[] columns = header.split(",");
    String[] semesters = Arrays.copyOfRange(columns, 2, columns.length - 1);

    String line;
    while ((line = br.readLine()) != null) {
      String[] tokens = line.split(",(?=([^\"]*\"[^\"]*\")*[^\"]*$)");
      String courseCode = tokens[0];
      String courseName = tokens[1];
      CourseInfo info = new CourseInfo(courseName);

      for (int i = 2; i < tokens.length - 1; i++) {
        String cell = tokens[i].trim();
        String semester = semesters[i - 2];

        if (cell.equals("[]")) {
          info.semesterToTreeId.put(semester, null);
        } else if (!cell.isEmpty()) {
          String normalized = cell.replaceAll("\\s+", ""); // normalize spacing
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
    // PRINTING PREREQ
    //    for (String code : catalog.courseMap.keySet()) {
    //      CourseInfo info = catalog.courseMap.get(code);
    //      System.out.println(code + ": " + info.courseName);
    //      for (String sem : info.semesterToTreeId.keySet()) {
    //        String treeId = info.semesterToTreeId.get(sem);
    //        System.out.print("  " + sem + ": ");
    //        if (treeId == null) {
    //          System.out.println("No prerequisites");
    //        } else {
    //          System.out.println(catalog.treeMap.get(treeId));
    //        }
    //      }
    //    }

    // PRINTING TREE
    for (String code : catalog.courseMap.keySet()) {
      CourseInfo info = catalog.courseMap.get(code);
      System.out.println(code + ": " + info.courseName);
      for (String sem : info.semesterToTreeId.keySet()) {
        String treeId = info.semesterToTreeId.get(sem);
        System.out.println("  " + sem + ":");
        if (treeId == null) {
          System.out.println("    No prerequisites");
        } else {
          PrereqTreeNode tree = catalog.treeMap.get(treeId);
          System.out.print(tree.toPrettyString("    "));
        }
      }
    }
  }

  private static PrereqTreeNode parseTree(String str) {
    str = str.replaceAll("[\\[\\]\"]", "").trim();

    // Empty or [] → return null
    if (str.isEmpty()) return null;

    // Normalize unwrapped comma lists
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
