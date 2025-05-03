// import { useState } from "react";
// import { CourseItem } from "../types";
// import { useEffect } from "react";

// type Course = CourseItem;

// export function CourseDragManager(
//   uid: string,
//   options?: {
//     setSelectedSemester?: (s: string) => void;
//     setUsedSemesters?: (arr: string[]) => void;
//   }
// ) {
//   const [courses, setCourses] = useState<Course[]>([]);
//   const [draggedCourse, setDraggedCourse] = useState<string | null>(null);
//   const [emptySlots, setEmptySlots] = useState<{ [key: string]: number }>({});

//   const setPrereqStatus = (id: string, met: boolean) => {
//     setCourses((prev) =>
//       prev.map((c) => (c.id === id ? { ...c, prereqMet: met } : c))
//     );
//   };

//   const handleDragStart = (
//     e: React.DragEvent,
//     course: { courseCode: string; courseTitle: string; semesterId: string }
//   ) => {
//     const courseToMove = courses.find(
//       (c) =>
//         c.courseCode === course.courseCode && c.semesterId === course.semesterId
//     );

//     if (courseToMove) {
//       e.dataTransfer.setData("courseId", courseToMove.id);
//     }

//     e.dataTransfer.setData("courseCode", course.courseCode);
//     e.dataTransfer.setData("courseTitle", course.courseTitle);
//     e.dataTransfer.setData("semesterId", course.semesterId);

//     setDraggedCourse(courseToMove?.id || null);

//     const target = e.currentTarget as HTMLElement;
//     setTimeout(() => {
//       if (target) target.style.opacity = "0.4";
//     }, 0);
//   };

//   const handleDragEnd = (e: React.DragEvent) => {
//     if (e.currentTarget instanceof HTMLElement) {
//       e.currentTarget.style.opacity = "1";
//     }
//     setDraggedCourse(null);
//   };

//   const handleDragOver = (e: React.DragEvent) => {
//     e.preventDefault();
//   };

//   const handleDrop = (e: React.DragEvent, targetSemesterId: string) => {
//     e.preventDefault();
//     const courseId = e.dataTransfer.getData("courseId");
//     const courseCode = e.dataTransfer.getData("courseCode");
//     const courseTitle = e.dataTransfer.getData("courseTitle");
//     const sourceSemesterId = e.dataTransfer.getData("semesterId");

//     if (courseId || (courseCode && sourceSemesterId)) {
//       setCourses((prevCourses) =>
//         prevCourses.map((course) => {
//           const isMatch = courseId
//             ? course.id === courseId
//             : course.courseCode === courseCode &&
//               course.semesterId === sourceSemesterId;

//           return isMatch ? { ...course, semesterId: targetSemesterId } : course;
//         })
//       );

//       console.log(
//         `Moved course from ${sourceSemesterId} to ${targetSemesterId}`
//       );
//     }
//   };

//   const getCoursesForSemester = (semesterId: string) => {
//     return courses.filter((course) => course.semesterId === semesterId);
//   };

//   const getLatestSemester = () => {
//     const terms = ["Spring", "Summer", "Fall", "Winter"];
//     return courses
//       .map((c) => c.semesterId)
//       .sort((a, b) => {
//         const [termA, yearA] = a.split(" ");
//         const [termB, yearB] = b.split(" ");
//         const yDiff = parseInt(yearB) - parseInt(yearA);
//         return yDiff !== 0
//           ? yDiff
//           : terms.indexOf(termB) - terms.indexOf(termA);
//       })[0];
//   };

//   const addCourse = (
//     semesterId: string,
//     course?: Partial<CourseItem>,
//     source: "search" | "new" = "search"
//   ) => {
//     const newCourse: CourseItem = {
//       id: course?.id ?? crypto.randomUUID(),
//       courseCode: course?.courseCode ?? (source === "new" ? "" : "Couse Code"),
//       courseTitle:
//         course?.courseTitle ?? (source === "new" ? "" : "Course Title"),
//       semesterId,
//       isEditing: source === "new" ? true : course?.isEditing ?? false,
//       prereqMet: course?.prereqMet ?? false,
//     };

//     setCourses((prev) => [...prev, newCourse]);
//   };

//   const buildSemesterMap = () => {
//     const semesterMap: {
//       [semester: string]: { id: string; courseCode: string }[];
//     } = {};

//     for (const course of courses) {
//       if (!semesterMap[course.semesterId]) {
//         semesterMap[course.semesterId] = [];
//       }

//       semesterMap[course.semesterId].push({
//         id: course.id,
//         courseCode: course.courseCode,
//       });
//     }

//     return semesterMap;
//   };

//   async function fetchUserCoursesOnLoad(uid: string) {
//     try {
//       const response = await fetch(
//         `http://localhost:3232/get-user-courses-detailed?uid=${encodeURIComponent(
//           uid
//         )}`
//       );

//       if (!response.ok) {
//         const text = await response.text();
//         console.error("Fetch failed:", response.status, text);
//         return;
//       }

//       const result = await response.json();
//       const semesterToCourses = result.semesters || {};

//       const loadedCourses: CourseItem[] = [];

//       for (const [semesterId, courses] of Object.entries(semesterToCourses)) {
//         for (const courseObj of courses as Array<{
//           courseCode: string;
//           courseTitle?: string;
//         }>) {
//           loadedCourses.push({
//             id: crypto.randomUUID(),
//             courseCode: courseObj.courseCode,
//             courseTitle: courseObj.courseTitle ?? "",
//             semesterId,
//             isEditing: false,
//             prereqMet: false,
//           });
//         }
//       }

//       setCourses(loadedCourses);
//       const loadedSemesters = [
//         ...new Set(loadedCourses.map((c) => c.semesterId)),
//       ];
//       const latest = getLatestSemester();
//       options?.setUsedSemesters?.(loadedSemesters);
//       options?.setSelectedSemester?.(latest);
//     } catch (error) {
//       console.error("Error loading courses:", error);
//     }
//   }

//   useEffect(() => {
//     if (uid) {
//       fetchUserCoursesOnLoad(uid);
//     }
//   }, [uid]);

//   return {
//     courses,
//     setCourses,
//     setPrereqStatus,
//     draggedCourse,
//     emptySlots,
//     handleDragStart,
//     handleDragEnd,
//     handleDragOver,
//     handleDrop,
//     getCoursesForSemester,
//     addCourse,
//   };
// }

import { useState } from "react";
import { CourseItem } from "../types";

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

  const setPrereqStatus = (id: string, met: boolean) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, prereqMet: met } : c))
    );
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

  const handleDrop = (e: React.DragEvent, targetSemesterId: string) => {
    e.preventDefault();
    const courseId = e.dataTransfer.getData("courseId");
    const courseCode = e.dataTransfer.getData("courseCode");
    const title = e.dataTransfer.getData("title");
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

  const addCourse = (
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
      prereqsMet: course?.prereqsMet ?? false,
    };

    setCourses((prev) => [...prev, newCourse]);
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
  };
}
