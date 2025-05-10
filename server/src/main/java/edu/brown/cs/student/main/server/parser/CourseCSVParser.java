package edu.brown.cs.student.main.server.parser;

import java.io.BufferedReader;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class CourseCSVParser {

  /**
   * Parse the CSV file into a CourseCatalog. Each line is a course with columns that represent
   * different semesters and their prerequisites. Square brackets mean AND; curly braces mean OR.
   */
  public static CourseCatalog parse(String filepath) throws IOException {
    CourseCatalog catalog = new CourseCatalog();
    Map<String, String> prereqStringToTreeId = new HashMap<>();

    // Load the CSV file as a resource
    InputStream is = CourseCSVParser.class.getClassLoader().getResourceAsStream(filepath);
    if (is == null) {
      throw new FileNotFoundException("Resource not found: " + filepath);
    }
    BufferedReader br = new BufferedReader(new InputStreamReader(is));

    // First line is the header
    String header = br.readLine();
    String[] columns = header.split(",", -1);
    // columns[0] = "Course Code"
    // columns[1] = "Course Name"
    // columns[2..] = each semester label
    String[] semesters = Arrays.copyOfRange(columns, 2, columns.length);

    String line;
    while ((line = br.readLine()) != null) {
      // Split each row, preserving trailing empty fields but carefully handling quoted commas
      String[] tokens = line.split(",(?=([^\"]*\"[^\"]*\")*[^\"]*$)", -1);

      String courseCode = tokens[0];
      String courseName = tokens[1];
      CourseInfo info = new CourseInfo(courseName);

      // For each semester column (starting at index 2)
      for (int i = 2; i < tokens.length; i++) {
        String cell = tokens[i].trim();
        String semester = semesters[i - 2];

        // If cell is "[]" (meaning no prereqs) or empty
        if (cell.equals("[]")) {
          // We explicitly store null if no prereqs
          info.semesterToTreeId.put(semester, null);
        } else if (!cell.isEmpty()) {
          // Remove double-quotes only, but preserve []{} to parse
          String normalized = cell.replaceAll("\"", "").trim();

          // If we haven't seen this prereq combination before, parse & store it
          if (!prereqStringToTreeId.containsKey(normalized)) {
            String treeId = UUID.randomUUID().toString();
            PrereqTreeNode tree = parseTree(normalized);
            if (tree != null) {
              prereqStringToTreeId.put(normalized, treeId);
              catalog.addTree(treeId, tree);
            }
          }
          // Use the existing ID
          String reusedId = prereqStringToTreeId.get(normalized);
          info.semesterToTreeId.put(semester, reusedId);
        }
      }
      // Add the course to the catalog
      catalog.addCourse(courseCode, info);
    }
    br.close();

    //    // PRINTING TREE
    //    for (String code : catalog.courseMap.keySet()) {
    //      CourseInfo info = catalog.courseMap.get(code);
    //      System.out.println(code + ": " + info.courseName);
    //      for (String sem : info.semesterToTreeId.keySet()) {
    //        String treeId = info.semesterToTreeId.get(sem);
    //        System.out.println("  " + sem + ":");
    //        if (treeId == null) {
    //          System.out.println("    No prerequisites");
    //        } else {
    //          PrereqTreeNode tree = catalog.treeMap.get(treeId);
    //          System.out.print(tree.toPrettyString("    "));
    //        }
    //      }
    //    }
    //    System.out.println(catalog.getPrereqTree("CSCI 1230", "Fall 22"));

    return catalog;
  }

  /**
   * Recursively parse a string that may be: - a single token (e.g. "CSCI 0112" or "CSCI 0190*") -
   * an AND group in square brackets "[ ... ]" - an OR group in curly braces "{ ... }" Nested
   * structures are allowed.
   */
  private static PrereqTreeNode parseTree(String str) {
    str = str.trim();
    if (str.isEmpty()) {
      return null;
    }

    char first = str.charAt(0);
    // If the string starts with a bracket, see if there's a matching bracket at the end
    if ((first == '[' || first == '{') && str.length() > 1) {
      int matchingIndex = findMatchingBracket(str, 0);
      // If the matching bracket is the last character, then the entire string is one bracketed
      // group
      if (matchingIndex == str.length() - 1) {
        // Determine AND vs. OR
        PrereqTreeNode.Type type =
            (first == '[') ? PrereqTreeNode.Type.AND : PrereqTreeNode.Type.OR;
        // Strip off the outer brackets
        String inside = str.substring(1, str.length() - 1).trim();
        return parseBracketGroup(inside, type);
      }
    }

    // If we get here, it's just a single token with no outer bracket
    //    return new PrereqTreeNode(str);

    boolean isConcurrent = str.endsWith("*");
    String cleaned = str.replace("*", "").trim();
    return new PrereqTreeNode(cleaned, isConcurrent);
  }

  /**
   * Parse the contents inside a bracket group (square or curly) as a top-level list of
   * comma-separated entries. Each entry can itself be bracketed or a single token.
   */
  private static PrereqTreeNode parseBracketGroup(String contents, PrereqTreeNode.Type type) {
    PrereqTreeNode node = new PrereqTreeNode(type);

    int start = 0;
    int bracketDepth = 0;
    for (int i = 0; i < contents.length(); i++) {
      char c = contents.charAt(i);
      if (c == '[' || c == '{') {
        bracketDepth++;
      } else if (c == ']' || c == '}') {
        bracketDepth--;
      } else if (c == ',' && bracketDepth == 0) {
        // Found a top-level comma => split
        String piece = contents.substring(start, i).trim();
        if (!piece.isEmpty()) {
          node.children.add(parseTree(piece));
        }
        start = i + 1;
      }
    }
    // Add the last piece after the final comma (or if no commas at all)
    String lastPiece = contents.substring(start).trim();
    if (!lastPiece.isEmpty()) {
      node.children.add(parseTree(lastPiece));
    }

    return node;
  }

  /**
   * Finds the index of the matching closing bracket for the bracket at str[start]. Returns -1 if
   * not found. This handles nested brackets.
   */
  private static int findMatchingBracket(String str, int start) {
    if (start >= str.length()) {
      return -1;
    }
    char open = str.charAt(start);
    char close = (open == '[') ? ']' : '}';
    int depth = 0;
    for (int i = start; i < str.length(); i++) {
      char c = str.charAt(i);
      if (c == open) {
        depth++;
      } else if (c == close) {
        depth--;
        if (depth == 0) {
          return i;
        }
      }
    }
    return -1;
  }
}
