import { useState } from "react";
import { CourseItem } from "../types";

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
    e.dataTransfer.setData("courseCode", course.courseCode);
    e.dataTransfer.setData("courseTitle", course.courseTitle);
    e.dataTransfer.setData("semesterId", course.semesterId);

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

    if (courseId && draggedCourse) {
      setCourses((prevCourses) =>
        prevCourses.map((course) =>
          course.id === courseId
            ? { ...course, semesterId: targetSemesterId }
            : course
        )
      );
    }
  };

  const getCoursesForSemester = (semesterId: string) => {
    return courses.filter((course) => course.semesterId === semesterId);
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
