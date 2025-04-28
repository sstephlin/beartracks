// package edu.brown.cs.student.main.server.storage;
//
// import java.util.*;
//
// public class SemesterKey implements Comparable<SemesterKey> {
//  private final String term;
//  private final int year;
//
//  private static final List<String> TERM_ORDER = List.of("Winter", "Spring", "Summer", "Fall");
//
//  public SemesterKey(String term, int year) {
//    if (!TERM_ORDER.contains(term)) {
//      throw new IllegalArgumentException("Invalid term: " + term);
//    }
//    this.term = term;
//    this.year = year;
//  }
//
//  public String getTerm() {
//    return term;
//  }
//
//  public int getYear() {
//    return year;
//  }
//
//  @Override
//  public int compareTo(SemesterKey other) {
//    int yearCompare = Integer.compare(this.year, other.year);
//    if (yearCompare != 0) return yearCompare;
//    return Integer.compare(TERM_ORDER.indexOf(this.term), TERM_ORDER.indexOf(other.term));
//  }
//
//  @Override
//  public boolean equals(Object o) {
//    if (!(o instanceof SemesterKey)) return false;
//    SemesterKey other = (SemesterKey) o;
//    return this.term.equals(other.term) && this.year == other.year;
//  }
//
//  @Override
//  public int hashCode() {
//    return Objects.hash(term, year);
//  }
//
//  @Override
//  public String toString() {
//    return term + " " + year;
//  }
// }
