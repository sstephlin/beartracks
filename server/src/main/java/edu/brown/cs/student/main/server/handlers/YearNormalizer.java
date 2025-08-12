package edu.brown.cs.student.main.server.handlers;

/** Utility class to normalize year formats between 2-digit and 4-digit representations. */
public class YearNormalizer {

  /**
   * Normalizes a year string to 2-digit format. Examples: - "2021" -> "21" - "21" -> "21" - "2022"
   * -> "22"
   *
   * @param year The year string (either 2-digit or 4-digit)
   * @return The normalized 2-digit year string
   */
  public static String to2Digit(String year) {
    if (year == null) return null;

    // If it's already 2 digits, return as is
    if (year.length() == 2) {
      return year;
    }

    // If it's 4 digits starting with "20", return last 2 digits
    if (year.length() == 4 && year.startsWith("20")) {
      return year.substring(2);
    }

    // Otherwise return as is (shouldn't happen with valid input)
    return year;
  }

  /**
   * Normalizes a semester key to use 2-digit year format. Examples: - "Fall 2021" -> "Fall 21" -
   * "Spring 22" -> "Spring 22"
   *
   * @param semesterKey The semester key (e.g., "Fall 2021" or "Fall 21")
   * @return The normalized semester key with 2-digit year
   */
  public static String normalizeSemesterKey(String semesterKey) {
    if (semesterKey == null) return null;

    String[] parts = semesterKey.split(" ");
    if (parts.length != 2) return semesterKey;

    String term = parts[0];
    String year = parts[1];

    return term + " " + to2Digit(year);
  }
}
