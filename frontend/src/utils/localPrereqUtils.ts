import { CourseItem } from "../types";
import { sessionStorageUtils } from "./sessionStorageUtils";

// Static prerequisite data structure
// This would ideally be loaded from a JSON file or API endpoint
const COURSE_PREREQUISITES: { [courseCode: string]: PrerequisiteRule } = {
  // Computer Science courses - Note: courses without prerequisites are not listed
  // CS 61A has no prerequisites (intro course)
  // CS 88 has no prerequisites (intro course)
  "CS 61B": {
    type: "and",
    children: [
      { type: "or", children: [
        { type: "course", courseCode: "CS 61A" },
        { type: "course", courseCode: "CS 88" }
      ]}
    ]
  },
  "CS 61C": {
    type: "and",
    children: [
      { type: "course", courseCode: "CS 61A" },
      { type: "course", courseCode: "CS 61B" }
    ]
  },
  "CS 70": {
    type: "and",
    children: [
      { type: "course", courseCode: "CS 61A" },
      { type: "course", courseCode: "MATH 1A" },
      { type: "course", courseCode: "MATH 1B" }
    ]
  },
  "CS 162": {
    type: "and",
    children: [
      { type: "course", courseCode: "CS 61B" },
      { type: "course", courseCode: "CS 61C" },
      { type: "course", courseCode: "CS 70" }
    ]
  },
  "CS 170": {
    type: "and",
    children: [
      { type: "course", courseCode: "CS 61B" },
      { type: "course", courseCode: "CS 70" }
    ]
  },
  "CS 188": {
    type: "and",
    children: [
      { type: "course", courseCode: "CS 61A" },
      { type: "course", courseCode: "CS 61B" },
      { type: "course", courseCode: "CS 70" }
    ]
  },
  "CS 189": {
    type: "and",
    children: [
      { type: "course", courseCode: "CS 70" },
      { type: "course", courseCode: "MATH 53" },
      { type: "course", courseCode: "MATH 54" },
      { type: "or", children: [
        { type: "course", courseCode: "CS 61B" },
        { type: "course", courseCode: "EECS 16B" }
      ]}
    ]
  },
  "CS 161": {
    type: "and",
    children: [
      { type: "course", courseCode: "CS 61B" },
      { type: "course", courseCode: "CS 61C" },
      { type: "course", courseCode: "CS 70" }
    ]
  },
  "CS 164": {
    type: "and",
    children: [
      { type: "course", courseCode: "CS 61B" },
      { type: "course", courseCode: "CS 61C" }
    ]
  },
  "CS 186": {
    type: "and",
    children: [
      { type: "course", courseCode: "CS 61B" },
      { type: "course", courseCode: "CS 61C" }
    ]
  },
  // EECS courses
  "EECS 16A": {
    type: "course",
    courseCode: "MATH 1B"
  },
  "EECS 126": {
    type: "and",
    children: [
      { type: "course", courseCode: "CS 70" },
      { type: "course", courseCode: "MATH 53" },
      { type: "course", courseCode: "MATH 54" }
    ]
  },
  "EECS 127": {
    type: "and",
    children: [
      { type: "course", courseCode: "MATH 53" },
      { type: "course", courseCode: "MATH 54" }
    ]
  },
  "EECS 16B": {
    type: "and",
    children: [
      { type: "course", courseCode: "EECS 16A" },
      { type: "course", courseCode: "MATH 1B" }
    ]
  },
  // Data Science courses
  // DATA 8 has no prerequisites (intro course)
  "DATA 100": {
    type: "and",
    children: [
      { type: "course", courseCode: "DATA 8" },
      { type: "or", children: [
        { type: "course", courseCode: "CS 61A" },
        { type: "course", courseCode: "CS 88" }
      ]},
      { type: "or", children: [
        { type: "course", courseCode: "MATH 54" },
        { type: "course", courseCode: "EECS 16A" }
      ]}
    ]
  },
  "DATA 102": {
    type: "and",
    children: [
      { type: "course", courseCode: "DATA 100" },
      { type: "course", courseCode: "CS 70" },
      { type: "course", courseCode: "MATH 54" }
    ]
  },
  "DATA 140": {
    type: "and",
    children: [
      { type: "course", courseCode: "DATA 8" },
      { type: "course", courseCode: "CS 70" },
      { type: "course", courseCode: "MATH 53" },
      { type: "course", courseCode: "MATH 54" }
    ]
  },
  // Math courses
  "MATH 1B": {
    type: "course",
    courseCode: "MATH 1A"
  },
  "MATH 53": {
    type: "course",
    courseCode: "MATH 1B"
  },
  "MATH 54": {
    type: "and",
    children: [
      { type: "course", courseCode: "MATH 1A" },
      { type: "course", courseCode: "MATH 1B" }
    ]
  },
  "MATH 110": {
    type: "and",
    children: [
      { type: "course", courseCode: "MATH 54" },
      { type: "course", courseCode: "CS 70" }
    ]
  },
  // Statistics courses
  "STAT 134": {
    type: "and",
    children: [
      { type: "course", courseCode: "MATH 53" },
      { type: "course", courseCode: "MATH 54" }
    ]
  },
  "STAT 135": {
    type: "and",
    children: [
      { type: "course", courseCode: "STAT 134" },
      { type: "course", courseCode: "MATH 53" },
      { type: "course", courseCode: "MATH 54" }
    ]
  },
  // Upper division CS courses
  "CS 152": {
    type: "and",
    children: [
      { type: "course", courseCode: "CS 61C" }
    ]
  },
  "CS 160": {
    type: "or",
    children: [
      { type: "course", courseCode: "CS 61B" },
      { type: "course", courseCode: "CS 61BL" }
    ]
  },
  "CS 169A": {
    type: "and",
    children: [
      { type: "course", courseCode: "CS 61B" },
      { type: "course", courseCode: "CS 70" }
    ]
  },
  "CS 182": {
    type: "and",
    children: [
      { type: "course", courseCode: "CS 70" },
      { type: "course", courseCode: "CS 188" }
    ]
  },
  "CS 194": {
    type: "and",
    children: [
      { type: "course", courseCode: "CS 61B" },
      { type: "course", courseCode: "CS 61C" }
    ]
  },
  // Add more courses as needed
};

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

// Check prerequisites for a course locally
// Returns: true if met, false if not met, undefined if no data available
export function checkPrereqsLocal(
  courseCode: string,
  targetSemester: string
): boolean | undefined {
  // Normalize course code - remove spaces and convert to uppercase
  const normalizedCode = courseCode.replace(/\s+/g, ' ').trim().toUpperCase();
  const prereqRule = COURSE_PREREQUISITES[normalizedCode];
  
  console.log("Local prereq check for:", normalizedCode, "has rule:", !!prereqRule);
  
  if (!prereqRule) {
    // Check if this is a known intro course with no prerequisites
    const introCourses = ["CS 61A", "CS 88", "DATA 8", "MATH 1A", "CS 10", "EE 16A", "PHYSICS 7A"];
    if (introCourses.includes(normalizedCode)) {
      console.log(`${normalizedCode} is an intro course with no prerequisites`);
      return true;  // Intro courses have no prerequisites, so they're always met
    }
    
    // No prerequisite data available for this course
    console.log(`No prerequisite data available for ${normalizedCode}`);
    return undefined;
  }

  // Get all courses from session storage
  const allCourses = getAllCoursesFromSession();
  
  console.log("All courses from session:", allCourses.map(c => `${c.courseCode} in ${c.semesterId}`));
  
  // Build a map of taken courses and their semesters
  const takenCourses = new Map<string, string>();
  allCourses.forEach(course => {
    if (!course.isManual) {
      const normalizedCourseCode = course.courseCode.replace(/\s+/g, ' ').trim().toUpperCase();
      takenCourses.set(normalizedCourseCode, course.semesterId);
    }
  });
  
  console.log("Taken courses map:", Array.from(takenCourses.entries()));

  // Check if prerequisites are satisfied
  const result = checkPrerequisiteRule(prereqRule, takenCourses, targetSemester);
  console.log(`Prereq check result for ${normalizedCode} in ${targetSemester}:`, result.satisfied);
  return result.satisfied;
}

// Get prerequisite data for display (for the prerequisites popup)
export function getPrerequisiteDataLocal(
  courseCode: string,
  targetSemester: string
): PrerequisiteResponse {
  // Normalize course code - remove spaces and convert to uppercase
  const normalizedCode = courseCode.replace(/\s+/g, ' ').trim().toUpperCase();
  const prereqRule = COURSE_PREREQUISITES[normalizedCode];
  
  console.log("Getting local prereq data for:", normalizedCode, "has rule:", !!prereqRule);
  
  if (!prereqRule) {
    // Check if this is a known intro course with no prerequisites
    const introCourses = ["CS 61A", "CS 88", "DATA 8", "MATH 1A", "CS 10", "EE 16A", "PHYSICS 7A"];
    if (introCourses.includes(normalizedCode)) {
      return {
        hasPrereqs: false,
        message: "No prerequisites required",
        displayText: "This is an introductory course with no prerequisites"
      };
    }
    
    // No prerequisite data available
    return {
      hasPrereqs: false,
      message: "Prerequisite information not available",
      displayText: "Prerequisite information is not available for this course in offline mode"
    };
  }

  // Get all courses from session storage
  const allCourses = getAllCoursesFromSession();
  
  // Build a map of taken courses and their semesters
  const takenCourses = new Map<string, string>();
  allCourses.forEach(course => {
    if (!course.isManual) {
      const normalizedCourseCode = course.courseCode.replace(/\s+/g, ' ').trim().toUpperCase();
      takenCourses.set(normalizedCourseCode, course.semesterId);
    }
  });

  // Check prerequisites
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

// Export function to check if we have prerequisite data for a course
export function hasLocalPrerequisiteData(courseCode: string): boolean {
  return COURSE_PREREQUISITES.hasOwnProperty(courseCode.toUpperCase());
}