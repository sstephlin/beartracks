package edu.brown.cs.student.main.server.googleSheetsRequirements;

import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvException;
import java.io.IOException;
import java.io.StringReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class RequirementLoader {

  /**
   * Loads requirement rows from a Google Sheet published as a CSV.
   *
   * @param sheetId The ID of the Google Sheet.
   * @param gid The Grid ID (GID) of the specific tab to fetch.
   * @return A map of category names to RequirementRow objects.
   * @throws IOException If there's an error fetching or reading the data.
   */
  public static Map<String, RequirementRow> loadRequirementRows(String sheetId, String gid)
      throws IOException {
    List<List<Object>> rawRows = fetchFromPublishedCsv(sheetId, gid);
    Map<String, RequirementRow> requirements = new LinkedHashMap<>();

    if (rawRows.isEmpty()) {
      System.out.println("Warning: No raw data fetched from Google Sheet for GID: " + gid);
      return requirements;
    }

    // Map column names to their index positions
    Map<String, Integer> headerMap = new HashMap<>();
    List<Object> headerRow = rawRows.get(0);
    for (int i = 0; i < headerRow.size(); i++) {
      headerMap.put(headerRow.get(i).toString().trim(), i);
    }

    // Ensure all expected headers exist, now including "Parent Category"
    String[] expectedHeaders = {
      "Category Name",
      "Display Name",
      "Rule Type",
      "Accepted Courses",
      "Min Courses Required",
      "Max Uses",
      "Substitutions",
      "Alternative Category",
      "Overrides Category",
      "Parent Category" // Added the new header
    };
    for (String header : expectedHeaders) {
      if (!headerMap.containsKey(header)) {
        System.err.println(
            "Warning: Missing expected header in Google Sheet: "
                + header
                + ". Proceeding with a null value.");
      }
    }

    // Process each data row (skipping the header row)
    for (int i = 1; i < rawRows.size(); i++) {
      List<Object> row = rawRows.get(i);

      String categoryName = getValue(row, headerMap, "Category Name");
      String displayName = getValue(row, headerMap, "Display Name");

      // If the display name is empty, we skip this row and don't add it to the map.
      if (displayName.isEmpty()) {
        System.out.println("Skipping category with no display name: " + categoryName);
        continue;
      }

      String ruleType = getValue(row, headerMap, "Rule Type");
      List<String> acceptedCourses = splitList(getValue(row, headerMap, "Accepted Courses"));
      int minCoursesRequired =
          parseIntOrDefault(getValue(row, headerMap, "Min Courses Required"), 0);
      Integer maxUses = parseIntOrNull(getValue(row, headerMap, "Max Uses"));
      List<String> substitutions = splitList(getValue(row, headerMap, "Substitutions"));
      String alternativeCategory = getValue(row, headerMap, "Alternative Category");
      String overridesCategory = getValue(row, headerMap, "Overrides Category");

      // Get the value for the new "Parent Category" column
      String parentCategory = getValue(row, headerMap, "Parent Category");

      // Basic validation
      if (categoryName.isEmpty() || ruleType.isEmpty()) {
        System.err.println("Skipping malformed row (missing category name or rule type): " + row);
        continue;
      }

      RequirementRow requirementRow =
          new RequirementRow(
              categoryName,
              displayName,
              ruleType,
              acceptedCourses,
              minCoursesRequired,
              maxUses,
              substitutions,
              alternativeCategory,
              overridesCategory,
              parentCategory); // Added the new field to the constructor
      requirements.put(categoryName, requirementRow);
    }
    return requirements;
  }

  // --- Helper methods to correctly parse data from CSV rows ---

  private static String getValue(List<Object> row, Map<String, Integer> headerMap, String header) {
    if (headerMap.containsKey(header)) {
      int index = headerMap.get(header);
      if (index < row.size() && row.get(index) != null) {
        return row.get(index).toString().trim();
      }
    }
    return "";
  }

  private static List<List<Object>> fetchFromPublishedCsv(String sheetId, String gid)
      throws IOException {
    String url =
        "https://docs.google.com/spreadsheets/d/" + sheetId + "/export?format=csv&gid=" + gid;

    HttpClient client = HttpClient.newBuilder().followRedirects(HttpClient.Redirect.ALWAYS).build();

    HttpRequest request = HttpRequest.newBuilder().uri(URI.create(url)).build();

    try {
      HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

      if (response.statusCode() == 200) {
        return parseCsv(response.body());
      } else {
        // The 307 redirect should now be handled, so a non-200 status code is a real error.
        throw new IOException(
            "Failed to fetch Google Sheet data. HTTP Status: " + response.statusCode());
      }
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new IOException("Interrupted while fetching Google Sheet data", e);
    }
  }

  /**
   * Helper method to parse a CSV string into a list of lists of strings.
   *
   * @param csvContent The string content of the CSV.
   * @return A list of lists representing the CSV data.
   * @throws IOException If the CSV parsing fails.
   */
  private static List<List<Object>> parseCsv(String csvContent) throws IOException {
    try (CSVReader reader = new CSVReader(new StringReader(csvContent))) {
      List<String[]> lines = reader.readAll();
      return lines.stream()
          .map(line -> (List<Object>) (List<?>) Arrays.asList(line))
          .collect(Collectors.toList());
    } catch (CsvException e) {
      throw new IOException("Error parsing CSV data", e);
    }
  }

  private static List<String> splitList(String commaSeparatedString) {
    if (commaSeparatedString == null || commaSeparatedString.isEmpty()) {
      return Collections.emptyList();
    }
    return Arrays.stream(commaSeparatedString.split(","))
        .map(String::trim)
        .map(s -> s.replace("\"", ""))
        .filter(s -> !s.isEmpty())
        .collect(Collectors.toList());
  }

  private static int parseIntOrDefault(String s, int defaultValue) {
    try {
      return Integer.parseInt(s.trim());
    } catch (NumberFormatException e) {
      return defaultValue;
    }
  }

  private static Integer parseIntOrNull(String s) {
    if (s == null || s.trim().isEmpty()) {
      return null;
    }
    try {
      return Integer.parseInt(s.trim());
    } catch (NumberFormatException e) {
      return null;
    }
  }
}
