import { useState } from "react";

interface Course {
  id: string;
  courseCode: string;
  courseTitle: string;
  semesterId: string;
}

export function CourseDragManager(initialCourses: Course[]) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [draggedCourse, setDraggedCourse] = useState<string | null>(null);
  const [emptySlots, setEmptySlots] = useState<{ [key: string]: number }>({});

  const handleDragStart = (e: React.DragEvent, courseId: string) => {
    setDraggedCourse(courseId);
    e.dataTransfer.setData("courseId", courseId);

    setTimeout(() => {
      const target = e.currentTarget as HTMLElement;
      target.style.opacity = "0.4";
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

  const addCourse = (semesterId: string) => {
    const coursesInSemester = getCoursesForSemester(semesterId);
    if (coursesInSemester.length >= 10) return;

    const newCourse: Course = {
      id: `course-${Date.now()}`,
      courseCode: "NEW COURSE",
      courseTitle: "Click to edit...",
      semesterId,
    };

    setCourses([...courses, newCourse]);

    setEmptySlots((prev) => ({
      ...prev,
      [semesterId]: Math.min((prev[semesterId] || 0) + 0, 5),
    }));
  };

  return {
    courses,
    setCourses,
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
