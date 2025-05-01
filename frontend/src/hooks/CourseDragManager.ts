import { useState } from "react";
import { CourseItem } from "../types";
import { useEffect } from "react";

type Course = CourseItem;

export function CourseDragManager(initialCourses: CourseItem[]) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [draggedCourse, setDraggedCourse] = useState<string | null>(null);
  const [emptySlots, setEmptySlots] = useState<{ [key: string]: number }>({});

  const setPrereqStatus = (id: string, met: boolean) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, prereqMet: met } : c))
    );
  };

  const handleDragStart = (
    e: React.DragEvent,
    course: { courseCode: string; courseTitle: string; semesterId: string }
  ) => {
    const courseToMove = courses.find(
      (c) =>
        c.courseCode === course.courseCode && c.semesterId === course.semesterId
    );

    if (courseToMove) {
      e.dataTransfer.setData("courseId", courseToMove.id);
    }

    e.dataTransfer.setData("courseCode", course.courseCode);
    e.dataTransfer.setData("courseTitle", course.courseTitle);
    e.dataTransfer.setData("semesterId", course.semesterId);

    setDraggedCourse(courseToMove?.id || null);

    const target = e.currentTarget as HTMLElement;
    setTimeout(() => {
      if (target) target.style.opacity = "0.4";
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = "1";
    }
    setDraggedCourse(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetSemesterId: string) => {
    e.preventDefault();
    const courseId = e.dataTransfer.getData("courseId");
    const courseCode = e.dataTransfer.getData("courseCode");
    const courseTitle = e.dataTransfer.getData("courseTitle");
    const sourceSemesterId = e.dataTransfer.getData("semesterId");

    if (courseId || (courseCode && sourceSemesterId)) {
      setCourses((prevCourses) =>
        prevCourses.map((course) => {
          const isMatch = courseId
            ? course.id === courseId
            : course.courseCode === courseCode &&
              course.semesterId === sourceSemesterId;

          return isMatch ? { ...course, semesterId: targetSemesterId } : course;
        })
      );

      console.log(
        `Moved course from ${sourceSemesterId} to ${targetSemesterId}`
      );
    }
  };

  const getCoursesForSemester = (semesterId: string) => {
    return courses.filter((course) => course.semesterId === semesterId);
  };

  const getLatestSemester = () => {
    const terms = ["Spring", "Summer", "Fall", "Winter"];
    return courses
      .map((c) => c.semesterId)
      .sort((a, b) => {
        const [termA, yearA] = a.split(" ");
        const [termB, yearB] = b.split(" ");
        const yDiff = parseInt(yearA) - parseInt(yearB);
        return yDiff !== 0
          ? yDiff
          : terms.indexOf(termA) - terms.indexOf(termB);
      })[courses.length - 1]; // latest semester
  };

  const addCourse = (
    semesterId: string,
    course?: Partial<CourseItem>,
    source: "search" | "new" = "search"
  ) => {
    const newCourse: CourseItem = {
      id: course?.id ?? crypto.randomUUID(),
      courseCode: course?.courseCode ?? (source === "new" ? "" : "NEW-COURSE"),
      courseTitle:
        course?.courseTitle ?? (source === "new" ? "" : "New Course"),
      semesterId,
      isEditing: source === "new" ? true : course?.isEditing ?? false,
      prereqMet: course?.prereqMet ?? false,
    };

    setCourses((prev) => [...prev, newCourse]);
  };

  const buildSemesterMap = () => {
    const semesterMap: {
      [semester: string]: { id: string; courseCode: string }[];
    } = {};

    for (const course of courses) {
      if (!semesterMap[course.semesterId]) {
        semesterMap[course.semesterId] = [];
      }

      semesterMap[course.semesterId].push({
        id: course.id,
        courseCode: course.courseCode,
      });
    }

    return semesterMap;
  };

  const refreshPrereqStatuses = async () => {
    const semesterMap = buildSemesterMap();
    const currentSemester = getLatestSemester();
    if (!currentSemester) return;

    const response = await fetch("http://localhost:1234/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        semesterMap,
        currentSemester,
      }),
    });

    const result = await response.json();
    for (const { id, prereqMet } of result) {
      setPrereqStatus(id, prereqMet);
    }
  };

  useEffect(() => {
    refreshPrereqStatuses();
  }, [courses]);

  return {
    courses,
    setCourses,
    setPrereqStatus,
    draggedCourse,
    emptySlots,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    getCoursesForSemester,
    addCourse,
  };
}
