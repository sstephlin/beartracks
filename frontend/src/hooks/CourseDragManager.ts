import { useState } from "react";
import { CourseItem } from "../types";
import { checkPrereqs } from "../utils/prereqUtils";

type Course = CourseItem;

export function CourseDragManager(
  uid: string,
  {
    setSelectedSemester,
    setUsedSemesters,
    courses,
    setCourses,
  }: {
    setSelectedSemester?: (s: string) => void;
    setUsedSemesters?: (arr: string[]) => void;
    courses: Course[];
    setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  }
) {
  const [draggedCourse, setDraggedCourse] = useState<string | null>(null);
  const [emptySlots, setEmptySlots] = useState<{ [key: string]: number }>({});
  // Track courses being moved to avoid duplicate operations
  const [recentlyMovedCourses, setRecentlyMovedCourses] = useState<Set<string>>(
    new Set()
  );

  const recheckAllPrereqs = async (coursesArg: Course[]) => {
    if (!uid) return;

    const courseToSemesterMap: Record<string, string> = {};
    coursesArg.forEach((course) => {
      courseToSemesterMap[course.courseCode.toUpperCase()] = course.semesterId;
    });

    for (const course of coursesArg) {
      const result = await checkPrereqs(
        uid,
        course.courseCode,
        course.semesterId
      );

      // Only update prereq status without syncing to backend during bulk rechecks
      await updatePrereqStatusLocal(course.id, result);
      console.log(`Rechecking ${course.courseCode}: result=${result}`);
    }
  };

  // Update prereq status locally only
  const updatePrereqStatusLocal = async (id: string, met: boolean) => {
    setCourses((prev) => {
      return prev.map((c) => (c.id === id ? { ...c, prereqsMet: met } : c));
    });
  };

  // Use this when we need to sync with backend
  const setPrereqStatus = async (id: string, met: boolean) => {
    // First update locally
    const updatedCourses = await new Promise<Course[]>((resolve) => {
      setCourses((prev) => {
        const updated = prev.map((c) =>
          c.id === id ? { ...c, prereqsMet: met } : c
        );
        resolve(updated);
        return updated;
      });
    });

    const course = updatedCourses.find((c) => c.id === id);
    if (!course || !uid) return;

    // Check if this course was recently moved and is in our tracking Set
    const courseKey = `${course.courseCode}-${course.semesterId}`;
    if (recentlyMovedCourses.has(courseKey)) {
      console.log(
        `Skipping backend sync for recently moved course: ${courseKey}`
      );
      return;
    }

    const [term, year] = course.semesterId.split(" ");
    try {
      await fetch(
        `http://localhost:3232/add-course?uid=${uid}&code=${encodeURIComponent(
          course.courseCode
        )}&title=${encodeURIComponent(course.title)}&term=${term}&year=${year}`,
        { method: "POST" }
      );
    } catch (err) {
      console.error("Failed to sync prereqsMet to backend:", err);
    }
  };

  const handleDragStart = (
    e: React.DragEvent,
    course: { courseCode: string; title: string; semesterId: string }
  ) => {
    const courseToMove = courses.find(
      (c) =>
        c.courseCode === course.courseCode && c.semesterId === course.semesterId
    );

    if (courseToMove) {
      e.dataTransfer.setData("courseId", courseToMove.id);
    }

    e.dataTransfer.setData("courseCode", course.courseCode);
    e.dataTransfer.setData("title", course.title);
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

  const handleDrop = async (e: React.DragEvent, targetSemesterId: string) => {
    e.preventDefault();
    const courseId = e.dataTransfer.getData("courseId");
    const courseCode = e.dataTransfer.getData("courseCode");
    const title = e.dataTransfer.getData("title");
    const sourceSemesterId = e.dataTransfer.getData("semesterId");

    // Don't do anything if dropping on the same semester
    if (sourceSemesterId === targetSemesterId) {
      return;
    }

    if (courseId || (courseCode && sourceSemesterId)) {
      // Get the updated state using a promise
      const updatedCourses = await new Promise<CourseItem[]>((resolve) => {
        setCourses((prevCourses) => {
          const updated = prevCourses.map((course) => {
            const isMatch = courseId
              ? course.id === courseId
              : course.courseCode === courseCode &&
                course.semesterId === sourceSemesterId;

            return isMatch
              ? { ...course, semesterId: targetSemesterId }
              : course;
          });
          resolve(updated);
          return updated;
        });
      });

      console.log(
        `Moved course from ${sourceSemesterId} to ${targetSemesterId}`
      );

      // Add this course to our tracking Set to prevent duplicate backend operations
      // during prereq rechecking
      const movedCourseKey = `${courseCode}-${targetSemesterId}`;
      setRecentlyMovedCourses((prev) => {
        const newSet = new Set(prev);
        newSet.add(movedCourseKey);
        return newSet;
      });

      // Sync to backend
      const [newTerm, newYear] = targetSemesterId.split(" ");
      const [oldTerm, oldYear] = sourceSemesterId.split(" ");

      const userId = uid;
      if (userId) {
        try {
          // Remove from old semester
          await fetch(
            `http://localhost:3232/remove-course?uid=${userId}&code=${encodeURIComponent(
              courseCode
            )}&term=${oldTerm}&year=${oldYear}`,
            { method: "POST" }
          );
          console.log("✅ Removed course from previous semester.");

          // Add to new semester
          await fetch(
            `http://localhost:3232/add-course?uid=${userId}&code=${encodeURIComponent(
              courseCode
            )}&title=${encodeURIComponent(
              title
            )}&term=${newTerm}&year=${newYear}`,
            { method: "POST" }
          );
          console.log("✅ Added course to new semester.");

          // Explicitly check prerequisites for the moved course first
          const movedCourse = updatedCourses.find(
            (course) =>
              course.courseCode === courseCode &&
              course.semesterId === targetSemesterId
          );

          if (movedCourse) {
            const prereqsMet = await checkPrereqs(
              userId,
              courseCode,
              targetSemesterId
            );

            // Update the moved course's prereq status
            await updatePrereqStatusLocal(movedCourse.id, prereqsMet);
            console.log(
              `🔄 Rechecked moved course ${courseCode}: prereqsMet=${prereqsMet}`
            );

            // Find courses that might have the moved course as a prerequisite
            // and check their prereq status too
            for (const course of updatedCourses) {
              if (
                course.semesterId === targetSemesterId &&
                course.id !== movedCourse.id
              ) {
                const coursePrereqsMet = await checkPrereqs(
                  userId,
                  course.courseCode,
                  course.semesterId
                );
                await updatePrereqStatusLocal(course.id, coursePrereqsMet);
                console.log(
                  `🔄 Rechecked other course in same semester ${course.courseCode}: prereqsMet=${coursePrereqsMet}`
                );
              }
            }
          }

          // Then recheck all other prerequisites that might be affected
          setTimeout(() => {
            recheckAllPrereqs(updatedCourses);

            // Clear the recently moved courses tracking after prereq check is done
            setTimeout(() => {
              setRecentlyMovedCourses(new Set());
            }, 500);
          }, 100);
        } catch (err) {
          console.error("❌ Error syncing course move:", err);
          // Clear tracking set in case of error
          setRecentlyMovedCourses(new Set());
        }
      }
    }
  };

  const getCoursesForSemester = (semesterId: string) => {
    return courses.filter((course) => course.semesterId === semesterId);
  };

  const addCourse = async (
    semesterId: string,
    course?: Partial<CourseItem>,
    source: "search" | "new" = "search",
    isManual: boolean = source === "new",
  ) => {

    const newCourse: CourseItem = {
      id: course?.id ?? crypto.randomUUID(),
      courseCode: course?.courseCode ?? (source === "new" ? "" : "Course Code"),
      title: course?.title ?? (source === "new" ? "" : "Course Title"),
      semesterId,
      isEditing: source === "new" ? true : course?.isEditing ?? false,
      prereqsMet: true,
      isManual,
    };

    // For manually added courses, we just update the local state
    // The actual Firestore sync happens later in handleSaveCourse
    setCourses((prev) => [...prev, newCourse]);

    // No need to recheck prerequisites for empty new courses
    // The recheck will happen after the user finishes editing and saves
  };

  const buildSemesterMap = () => {
    const semesterMap: {
      [semester: string]: {
        id: string;
        courseCode: string;
        title: string;
        prereqsMet: boolean;
        isCapstone: boolean;
      }[];
    } = {};

    for (const course of courses) {
      if (!semesterMap[course.semesterId]) {
        semesterMap[course.semesterId] = [];
      }

      semesterMap[course.semesterId].push({
        id: course.id,
        courseCode: course.courseCode,
        title: course.title ?? "",
        prereqsMet: course.prereqsMet ?? false,
        isCapstone: course.isCapstone ?? false,
      });
    }

    return semesterMap;
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
    buildSemesterMap,
    recheckAllPrereqs,
  };
}
