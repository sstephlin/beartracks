//package edu.brown.cs.student.main.server.parser;
//
//// takes in a course's list of prereqs from our spreadsheet
//public class PrereqTreeParser {
//
//  public static PrereqTreeNode parsePrereqTree(String input) {
//    input = input.trim();
//    if (!input.startsWith("[") || !input.endsWith("]")) {
//      throw new IllegalArgumentException("Input must be wrapped in [ ]");
//    }
//
//    return parseBlock(input.substring(1, input.length() - 1).trim(), PrereqTreeNode.NodeType.AND);
//  }
//
//  private static PrereqTreeNode parseBlock(String input, PrereqTreeNode.NodeType type) {
//    PrereqTreeNode node = new PrereqTreeNode(type);
//    int i = 0;
//    while (i < input.length()) {
//      char c = input.charAt(i);
//      if (c == '[') {
//        int end = findClosing(input, i, '[', ']');
//        PrereqTreeNode child = parseBlock(input.substring(i + 1, end).trim(), PrereqTreeNode.NodeType.AND);
//        node.addChild(child);
//        i = end + 1;
//      } else if (c == '{') {
//        int end = findClosing(input, i, '{', '}');
//        PrereqTreeNode child = parseBlock(input.substring(i + 1, end).trim(), PrereqTreeNode.NodeType.OR);
//        node.addChild(child);
//        i = end + 1;
//      } else if (Character.isLetterOrDigit(c)) {
//        int end = i;
//        while (end < input.length() &&
//            (Character.isLetterOrDigit(input.charAt(end)) ||
//                input.charAt(end) == '*' ||
//                input.charAt(end) == ' ')) {
//          end++;
//        }
//        String course = input.substring(i, end).trim();
//        PrereqTreeNode courseNode = new PrereqTreeNode(course);
//        node.addChild(courseNode);
//        i = end;
//      } else {
//        i++; // skip commas/spaces
//      }
//    }
//    return node;
//  }
//
//  private static int findClosing(String input, int start, char open, char close) {
//    int depth = 0;
//    for (int i = start; i < input.length(); i++) {
//      if (input.charAt(i) == open) depth++;
//      else if (input.charAt(i) == close) depth--;
//      if (depth == 0) return i;
//    }
//    throw new IllegalArgumentException("Unmatched " + open);
//  }
//}