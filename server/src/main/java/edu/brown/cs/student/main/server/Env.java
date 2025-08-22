package edu.brown.cs.student.main.server;

import io.github.cdimascio.dotenv.Dotenv;

public class Env {
  private static Dotenv dotenv;

  static {
    try {
      dotenv = Dotenv.load();
    } catch (Exception e) {
      dotenv = null;
    }
  }

  public static String get(String key) {
    String value = System.getenv(key);
    if (value == null && dotenv != null) {
      value = dotenv.get(key);
    }
    return value;
  }
}
