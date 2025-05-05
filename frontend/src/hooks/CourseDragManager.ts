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

  // const recheckAllPrereqs = async () => {
  //   if (!uid) return;

  //   // Get the current mapping of courses to semesters
  //   const courseToSemesterMap: Record<string, string> = {};
  //   courses.forEach((course) => {
  //     courseToSemesterMap[course.courseCode.toUpperCase()] = course.semesterId;
  //   });

  //   // Check prerequisites for each course
  //   for (const course of courses) {
  //     console.log("this is the course: ", course);
  //     const result = await checkPrereqs(
  //       uid,
  //       course.courseCode,
  //       course.semesterId
  //     );
  //     setPrereqStatus(course.id, result);
  //     console.log(`Rechecking ${course.courseCode}: result=${result}`);
  //   }
  // };

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
      setPrereqStatus(course.id, result);
      console.log(`Rechecking ${course.courseCode}: result=${result}`);
    }
  };

  const setPrereqStatus = async (id: string, met: boolean) => {
    const updatedCourses = await setCourses((prev) => {
      const updated = prev.map((c) =>
        c.id === id ? { ...c, prereqsMet: met } : c
      );

      return updated;
    });

    const course = courses.find((c) => c.id === id); // use external state since setCourses is async-like
    if (!course || !uid) return;

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

          // Now recheck prerequisites with the updated courses
          setTimeout(() => {
            recheckAllPrereqs(updatedCourses);
          }, 100);
        } catch (err) {
          console.error("❌ Error syncing course move:", err);
        }
      }
    }
  };

  // const handleDrop = async (e: React.DragEvent, targetSemesterId: string) => {
  //   e.preventDefault();
  //   const courseId = e.dataTransfer.getData("courseId");
  //   const courseCode = e.dataTransfer.getData("courseCode");
  //   const title = e.dataTransfer.getData("title");
  //   const sourceSemesterId = e.dataTransfer.getData("semesterId");

  //   if (courseId || (courseCode && sourceSemesterId)) {
  //     setCourses((prevCourses) =>
  //       prevCourses.map((course) => {
  //         const isMatch = courseId
  //           ? course.id === courseId
  //           : course.courseCode === courseCode &&
  //             course.semesterId === sourceSemesterId;

  //         return isMatch ? { ...course, semesterId: targetSemesterId } : course;
  //       })
  //     );

  //     console.log(
  //       `Moved course from ${sourceSemesterId} to ${targetSemesterId}`
  //     );

  //     // const [newTerm, newYear] = targetSemesterId.split(" ");
  //     // const [oldTerm, oldYear] = sourceSemesterId.split(" ");

  //     // const userId = uid;
  //     // if (userId) {
  //     //   try {
  //     //     // Remove from old semester
  //     //     await fetch(
  //     //       `http://localhost:3232/remove-course?uid=${userId}&code=${encodeURIComponent(
  //     //         courseCode
  //     //       )}&term=${oldTerm}&year=${oldYear}`,
  //     //       { method: "POST" }
  //     //     );
  //     //     console.log("✅ Removed course from previous semester.");

  //     //     // Add to new semester
  //     //     await fetch(
  //     //       `http://localhost:3232/add-course?uid=${userId}&code=${encodeURIComponent(
  //     //         courseCode
  //     //       )}&title=${encodeURIComponent(
  //     //         title
  //     //       )}&term=${newTerm}&year=${newYear}`,
  //     //       { method: "POST" }
  //     //     );
  //     //     console.log("✅ Added course to new semester.");
  //     //   } catch (err) {
  //     //     console.error("❌ Error syncing course move:", err);
  //     //   }
  //     // }

  //     setTimeout(() => {
  //       recheckAllPrereqs([...courses]);
  //     }, 100);
  //   }
  // };

  const getCoursesForSemester = (semesterId: string) => {
    return courses.filter((course) => course.semesterId === semesterId);
  };

  // const addCourse = async (
  //   semesterId: string,
  //   course?: Partial<CourseItem>,
  //   source: "search" | "new" = "search"
  // ) => {
  //   const newCourse: CourseItem = {
  //     id: course?.id ?? crypto.randomUUID(),
  //     courseCode: course?.courseCode ?? (source === "new" ? "" : "Course Code"),
  //     title: course?.title ?? (source === "new" ? "" : "Course Title"),
  //     semesterId,
  //     isEditing: source === "new" ? true : course?.isEditing ?? false,
  //     prereqsMet: true,
  //   };

  //   setCourses((prev) => [...prev, newCourse]);

  //   // After adding a course, recheck all prerequisites
  //   setTimeout(() => {
  //     console.log("from addcourse recheck");
  //     recheckAllPrereqs([...courses]);
  //   }, 100); // Small delay to ensure state is updated
  // };

  const addCourse = async (
    semesterId: string,
    course?: Partial<CourseItem>,
    source: "search" | "new" = "search"
  ) => {
    const newCourse: CourseItem = {
      id: course?.id ?? crypto.randomUUID(),
      courseCode: course?.courseCode ?? (source === "new" ? "" : "Course Code"),
      title: course?.title ?? (source === "new" ? "" : "Course Title"),
      semesterId,
      isEditing: source === "new" ? true : course?.isEditing ?? false,
      prereqsMet: true,
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
