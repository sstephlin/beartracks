package edu.brown.cs.student.main.server.concentrationRequirements;

import java.util.List;

/**
 * Static class that stores all the courses that can be capstoned. This is only run once, when the
 * server starts.
 */
public class CSCapstoneCourses {
  // courses that CAN be capstoned but need to be indicated that user wants to capstone it
  public static final List<String> ALL =
      List.of(
          "CSCI 1230",
          "CSCI 1260",
          "CSCI 1290",
          "CSCI 1300",
          "CSCI 1320",
          "CSCI 1370",
          "CSCI 1380",
          "CSCI 1410",
          "CSCI 1420",
          "CSCI 1430",
          "CSCI 1440",
          "CSCI 1470",
          "CSCI 1515",
          "CSCI 1550",
          "CSCI 1600",
          "CSCI 1640",
          "CSCI 1660",
          "CSCI 1670",
          "CSCI 1680",
          "CSCI 1710",
          "CSCI 1730",
          "CSCI 1760",
          "CSCI 1950U",
          "CSCI 1951A",
          "CSCI 1951C",
          "CSCI 1951I",
          "CSCI 1951U",
          "CSCI 1951Z",
          "CSCI 1952B",
          "CSCI 1970",
          "CSCI 2240",
          "CSCI 2270",
          "CSCI 2340",
          "CSCI 2370",
          "CSCI 2390",
          "CSCI 2420",
          "CSCI 2500B",
          "CSCI 2510",
          "CSCI 2690",
          "CSCI 2950T",
          "CSCI 2950V",
          "CSCI 2951I",
          "CSCI 2952K",
          "CSCI 2952N",
          "CSCI 2952Q",
          "ENGN 1001");

  // courses that are SPECIFICALLY separate capstone courses from the regular version of the class
  public static final List<String> AUTO_ACCEPTED = List.of("CSCI 1234", "CSCI 1620", "CSCI 1690");
}
