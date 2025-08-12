import { CourseItem } from "../types";
import { sessionStorageUtils } from "./sessionStorageUtils";

interface PrerequisiteRule {
  type: "course" | "and" | "or";
  courseCode?: string;
  isConcurrent?: boolean;
  children?: PrerequisiteRule[];
}

interface PrerequisiteData {
  type: string;
  courseCode?: string;
  isConcurrent?: boolean;
  isCompleted?: boolean;
  completedInSemester?: string;
  satisfied: boolean;
  children?: PrerequisiteData[];
}

interface PrerequisiteResponse {
  hasPrereqs: boolean;
  prerequisiteTree?: PrerequisiteData;
  message?: string;
  displayText?: string;
  overallStatus?: string;
  summary?: string;
}

// Cache for loaded prerequisite data - maps courseCode -> semester -> prerequisite rule
let prerequisiteCache: Map<string, Map<string, PrerequisiteRule | null>> | null = null;

// Parse prerequisite string from CSV format
// Format: "[{CSCI 0180, CSCI 0160, CSCI 0190}, {MATH 0520, MATH 0540}]"
// Inner {} = OR condition, outer [] with comma separation = AND condition
function parsePrerequisiteString(prereqStr: string): PrerequisiteRule | null {
  if (!prereqStr || prereqStr === "[]" || prereqStr === "") {
    return null;
  }

  // Remove outer brackets
  prereqStr = prereqStr.trim();
  if (prereqStr.startsWith("[") && prereqStr.endsWith("]")) {
    prereqStr = prereqStr.slice(1, -1).trim();
  }

  if (!prereqStr) {
    return null;
  }

  // Split by }, { to get prerequisite groups (AND conditions)
  const groups: string[] = [];
  let currentGroup = "";
  let braceLevel = 0;
  let bracketLevel = 0;
  
  for (let i = 0; i < prereqStr.length; i++) {
    const char = prereqStr[i];
    if (char === "[") {
      bracketLevel++;
      // Don't include brackets in the content
      if (bracketLevel > 1) {
        currentGroup += char;
      }
    } else if (char === "]") {
      bracketLevel--;
      // Don't include brackets in the content
      if (bracketLevel > 0) {
        currentGroup += char;
      }
    } else if (char === "{") {
      braceLevel++;
      if (braceLevel === 1 && currentGroup.trim()) {
        // We have content before the brace, save it
        groups.push(currentGroup.trim());
        currentGroup = "";
      }
    } else if (char === "}") {
      braceLevel--;
      if (braceLevel === 0) {
        // End of a group
        if (currentGroup.trim()) {
          groups.push(currentGroup.trim());
          currentGroup = "";
        }
        // Skip any comma and whitespace after the closing brace
        while (i + 1 < prereqStr.length && (prereqStr[i + 1] === "," || prereqStr[i + 1] === " ")) {
          i++;
        }
      }
    } else {
      currentGroup += char;
    }
  }
  
  // Add any remaining content
  if (currentGroup.trim()) {
    groups.push(currentGroup.trim());
  }

  if (groups.length === 0) {
    return null;
  }

  // Parse each group
  const parsedGroups: PrerequisiteRule[] = [];
  
  for (const group of groups) {
    const courses = group.split(",").map(c => c.trim()).filter(c => c);
    
    if (courses.length === 0) continue;
    
    if (courses.length === 1) {
      // Single course - check for concurrent marker (*)
      let course = courses[0];
      // Remove any remaining brackets from course code
      course = course.replace(/[\[\]]/g, '').trim();
      const isConcurrent = course.endsWith("*");
      const courseCode = isConcurrent ? course.slice(0, -1).trim() : course;
      
      parsedGroups.push({
        type: "course",
        courseCode,
        isConcurrent
      });
    } else {
      // Multiple courses in a group = OR condition
      const orChildren: PrerequisiteRule[] = courses.map(course => {
        // Remove any remaining brackets from course code
        course = course.replace(/[\[\]]/g, '').trim();
        const isConcurrent = course.endsWith("*");
        const courseCode = isConcurrent ? course.slice(0, -1).trim() : course;
        return {
          type: "course" as const,
          courseCode,
          isConcurrent
        };
      });
      
      parsedGroups.push({
        type: "or",
        children: orChildren
      });
    }
  }

  if (parsedGroups.length === 0) {
    return null;
  }

  if (parsedGroups.length === 1) {
    return parsedGroups[0];
  }

  // Multiple groups = AND condition
  return {
    type: "and",
    children: parsedGroups
  };
}

// Load prerequisites from CSV file
export async function loadPrerequisites(): Promise<void> {
  if (prerequisiteCache) {
    return; // Already loaded
  }

  prerequisiteCache = new Map();

  try {
    // Fetch the CSV file from the public directory
    const response = await fetch("/cache_semesters/clean_prereqs.csv");
    if (!response.ok) {
      console.error("Failed to load prerequisites CSV:", response.status);
      return;
    }

    const csvText = await response.text();
    const lines = csvText.split("\n");
    
    if (lines.length < 2) {
      console.error("Invalid CSV format");
      return;
    }

    // Parse header to find semester columns
    const headers = lines[0].split(",").map(h => {
      const trimmed = h.trim();
      // Convert 2-digit years to 4-digit in headers
      const parts = trimmed.split(" ");
      if (parts.length === 2 && parts[1].length === 2) {
        return `${parts[0]} 20${parts[1]}`;
      }
      return trimmed;
    });
    
    // Process each course line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV line (handle commas inside brackets)
      const fields: string[] = [];
      let currentField = "";
      let inBrackets = false;
      
      for (const char of line) {
        if (char === "[" && !inBrackets) {
          inBrackets = true;
          currentField += char;
        } else if (char === "]" && inBrackets) {
          inBrackets = false;
          currentField += char;
        } else if (char === "," && !inBrackets) {
          fields.push(currentField);
          currentField = "";
        } else {
          currentField += char;
        }
      }
      fields.push(currentField); // Add the last field

      const courseCode = fields[0]?.trim();
      if (!courseCode) continue;

      // Map semester -> prerequisite rule for this course
      const courseSemesterMap = new Map<string, PrerequisiteRule | null>();
      
      // Parse prerequisites for each semester
      for (let j = 2; j < fields.length && j < headers.length; j++) {
        const semester = headers[j];
        const prereqStr = fields[j]?.trim();
        
        if (prereqStr) {
          const prereqRule = parsePrerequisiteString(prereqStr);
          courseSemesterMap.set(semester, prereqRule);
        }
      }

      prerequisiteCache.set(courseCode.toUpperCase(), courseSemesterMap);
    }

    console.log(`Loaded prerequisites for ${prerequisiteCache.size} courses`);
  } catch (error) {
    console.error("Error loading prerequisites:", error);
    prerequisiteCache = new Map(); // Initialize empty cache on error
  }
}

// Convert semester to numeric value for comparison
function semesterToNumeric(semester: string): number {
  const [term, year] = semester.split(" ");
  const yearNum = parseInt(year);
  const termValues: { [key: string]: number } = {
    "Spring": 0,
    "Summer": 1,
    "Fall": 2,
    "Winter": 3
  };
  return yearNum * 10 + (termValues[term] || 0);
}

// Check if a course was taken before a given semester
function wasCourseTakenBefore(courseSemester: string, targetSemester: string): boolean {
  return semesterToNumeric(courseSemester) < semesterToNumeric(targetSemester);
}

// Check if a course was taken before or during a given semester (for concurrent prereqs)
function wasCourseTakenBeforeOrDuring(courseSemester: string, targetSemester: string): boolean {
  return semesterToNumeric(courseSemester) <= semesterToNumeric(targetSemester);
}

// Get all courses from session storage
function getAllCoursesFromSession(): CourseItem[] {
  const sessionData = sessionStorageUtils.getSessionData();
  return sessionData?.courses || [];
}

// Check if a specific prerequisite rule is satisfied
function checkPrerequisiteRule(
  rule: PrerequisiteRule,
  takenCourses: Map<string, string>,
  targetSemester: string
): PrerequisiteData {
  if (rule.type === "course") {
    const courseCode = rule.courseCode!.toUpperCase();
    const takenSemester = takenCourses.get(courseCode);
    
    if (!takenSemester) {
      return {
        type: "course",
        courseCode: rule.courseCode,
        isConcurrent: rule.isConcurrent,
        isCompleted: false,
        satisfied: false
      };
    }

    const satisfied = rule.isConcurrent
      ? wasCourseTakenBeforeOrDuring(takenSemester, targetSemester)
      : wasCourseTakenBefore(takenSemester, targetSemester);

    return {
      type: "course",
      courseCode: rule.courseCode,
      isConcurrent: rule.isConcurrent,
      isCompleted: true,
      completedInSemester: takenSemester,
      satisfied
    };
  }

  if (rule.type === "and") {
    const children = rule.children?.map(child => 
      checkPrerequisiteRule(child, takenCourses, targetSemester)
    ) || [];
    
    const satisfied = children.every(child => child.satisfied);
    
    return {
      type: "and",
      satisfied,
      children
    };
  }

  if (rule.type === "or") {
    const children = rule.children?.map(child => 
      checkPrerequisiteRule(child, takenCourses, targetSemester)
    ) || [];
    
    const satisfied = children.some(child => child.satisfied);
    
    return {
      type: "or",
      satisfied,
      children
    };
  }

  return {
    type: "unknown",
    satisfied: false
  };
}

// Check prerequisites for a course locally using CSV data
export async function checkPrereqsFromCSV(
  courseCode: string,
  targetSemester: string
): Promise<boolean | undefined> {
  // Ensure prerequisites are loaded
  if (!prerequisiteCache) {
    await loadPrerequisites();
  }

  if (!prerequisiteCache) {
    console.error("Failed to load prerequisite data");
    return undefined;
  }

  // Normalize course code - handle variations like "CS" vs "CSCI"
  let normalizedCode = courseCode.replace(/\s+/g, ' ').trim().toUpperCase();
  
  // If the code starts with "CS " and not "CSCI", try converting it
  if (normalizedCode.startsWith("CS ") && !normalizedCode.startsWith("CSCI")) {
    const alternativeCode = normalizedCode.replace(/^CS /, "CSCI ");
    if (prerequisiteCache.has(alternativeCode)) {
      normalizedCode = alternativeCode;
    }
  }
  
  const courseSemesterMap = prerequisiteCache.get(normalizedCode);
  if (!courseSemesterMap) {
    // Course not in our data
    console.log(`No prerequisite data available for ${normalizedCode}`);
    return undefined;
  }
  
  // Find prerequisite rule for this specific semester or most recent one
  const prereqRule = findPrereqRuleForSemester(courseSemesterMap, targetSemester);
  
  console.log("CSV prereq check for:", normalizedCode, "in", targetSemester, "has rule:", !!prereqRule);

  if (prereqRule === null) {
    // Course explicitly has no prerequisites
    console.log(`${normalizedCode} has no prerequisites`);
    return true;
  }

  // Get all courses from session storage
  const allCourses = getAllCoursesFromSession();
  
  console.log("All courses from session:", allCourses.map(c => `${c.courseCode} in ${c.semesterId}`));
  
  // Build a map of taken courses and their semesters
  const takenCourses = new Map<string, string>();
  allCourses.forEach(course => {
    if (!course.isManual) {
      let normalizedCourseCode = course.courseCode.replace(/\s+/g, ' ').trim().toUpperCase();
      takenCourses.set(normalizedCourseCode, course.semesterId);
      
      // Also add CSCI version if it's a CS course
      if (normalizedCourseCode.startsWith("CS ") && !normalizedCourseCode.startsWith("CSCI")) {
        const csciVersion = normalizedCourseCode.replace(/^CS /, "CSCI ");
        takenCourses.set(csciVersion, course.semesterId);
      }
      // Also add CS version if it's a CSCI course
      else if (normalizedCourseCode.startsWith("CSCI ")) {
        const csVersion = normalizedCourseCode.replace(/^CSCI /, "CS ");
        takenCourses.set(csVersion, course.semesterId);
      }
    }
  });
  
  console.log("Taken courses map:", Array.from(takenCourses.entries()));

  // Check if prerequisites are satisfied
  if (!prereqRule) {
    return undefined;
  }
  const result = checkPrerequisiteRule(prereqRule, takenCourses, targetSemester);
  console.log(`Prereq check result for ${normalizedCode} in ${targetSemester}:`, result.satisfied);
  return result.satisfied;
}

// Get prerequisite data for display (for the prerequisites popup)
// Helper function to find the prerequisite rule for a specific semester
function findPrereqRuleForSemester(
  courseSemesterMap: Map<string, PrerequisiteRule | null>,
  targetSemester: string
): PrerequisiteRule | null | undefined {
  // First try exact match
  if (courseSemesterMap.has(targetSemester)) {
    return courseSemesterMap.get(targetSemester);
  }
  
  // If not found, find the most recent prerequisite before or at this semester
  const targetNum = semesterToNumeric(targetSemester);
  let bestSemester: string | null = null;
  let bestNum = -1;
  
  for (const [semester, rule] of courseSemesterMap) {
    const semNum = semesterToNumeric(semester);
    if (semNum <= targetNum && semNum > bestNum) {
      bestNum = semNum;
      bestSemester = semester;
    }
  }
  
  if (bestSemester) {
    return courseSemesterMap.get(bestSemester);
  }
  
  // No prerequisites defined for any semester
  return undefined;
}

export async function getPrerequisiteDataFromCSV(
  courseCode: string,
  targetSemester: string
): Promise<PrerequisiteResponse> {
  // Ensure prerequisites are loaded
  if (!prerequisiteCache) {
    await loadPrerequisites();
  }

  if (!prerequisiteCache) {
    return {
      hasPrereqs: false,
      message: "Unable to load prerequisite data",
      displayText: "Prerequisite information could not be loaded"
    };
  }

  // Normalize course code - handle variations like "CS" vs "CSCI"
  let normalizedCode = courseCode.replace(/\s+/g, ' ').trim().toUpperCase();
  
  // If the code starts with "CS " and not "CSCI", try converting it
  if (normalizedCode.startsWith("CS ") && !normalizedCode.startsWith("CSCI")) {
    const alternativeCode = normalizedCode.replace(/^CS /, "CSCI ");
    if (prerequisiteCache.has(alternativeCode)) {
      normalizedCode = alternativeCode;
    }
  }
  
  const courseSemesterMap = prerequisiteCache.get(normalizedCode);
  if (!courseSemesterMap) {
    // Course not in our data
    return {
      hasPrereqs: false,
      message: "Prerequisite information not available",
      displayText: "Prerequisite information is not available for this course"
    };
  }
  
  // Find prerequisite rule for this specific semester
  const prereqRule = findPrereqRuleForSemester(courseSemesterMap, targetSemester);
  
  console.log("Getting CSV prereq data for:", normalizedCode, "in", targetSemester, "has rule:", !!prereqRule);

  if (prereqRule === null) {
    // Course explicitly has no prerequisites
    return {
      hasPrereqs: false,
      message: "No prerequisites required",
      displayText: "This course has no prerequisites"
    };
  }

  // Get all courses from session storage
  const allCourses = getAllCoursesFromSession();
  
  // Build a map of taken courses and their semesters
  const takenCourses = new Map<string, string>();
  allCourses.forEach(course => {
    if (!course.isManual) {
      let normalizedCourseCode = course.courseCode.replace(/\s+/g, ' ').trim().toUpperCase();
      takenCourses.set(normalizedCourseCode, course.semesterId);
      
      // Also add CSCI version if it's a CS course
      if (normalizedCourseCode.startsWith("CS ") && !normalizedCourseCode.startsWith("CSCI")) {
        const csciVersion = normalizedCourseCode.replace(/^CS /, "CSCI ");
        takenCourses.set(csciVersion, course.semesterId);
      }
      // Also add CS version if it's a CSCI course
      else if (normalizedCourseCode.startsWith("CSCI ")) {
        const csVersion = normalizedCourseCode.replace(/^CSCI /, "CS ");
        takenCourses.set(csVersion, course.semesterId);
      }
    }
  });

  // Check prerequisites
  if (!prereqRule) {
    return {
      hasPrereqs: false,
      message: "No prerequisites required",
      displayText: "This course has no prerequisites"
    };
  }
  const prerequisiteTree = checkPrerequisiteRule(prereqRule, takenCourses, targetSemester);
  
  return {
    hasPrereqs: true,
    prerequisiteTree,
    overallStatus: prerequisiteTree.satisfied ? "satisfied" : "not satisfied",
    summary: prerequisiteTree.satisfied 
      ? "All prerequisites are satisfied" 
      : "Some prerequisites are not satisfied"
  };
}