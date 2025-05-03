import { useEffect, useState } from "react";
import SemesterBox from "./SemesterBox";
import CourseDrag from "./CourseDrag";
import { CarouselMover } from "../hooks/CarouselMover";
import { CourseDragManager } from "../hooks/CourseDragManager";
import { CourseItem } from "../types";
import { SignOutButton, useUser } from "@clerk/clerk-react";
import { checkPrereqs } from "../utils/prereqUtils";
import "../styles/Carousel.css";
import "../styles/SemesterBox.css";

const allSemesters = [
  "Fall 21",
  "Winter 21",
  "Spring 22",
  "Summer 22",
  "Fall 22",
  "Winter 22",
  "Spring 23",
  "Summer 23",
  "Fall 23",
  "Winter 23",
  "Spring 24",
  "Summer 24",
  "Fall 24",
  "Winter 24",
  "Spring 25",
  "Summer 25",
  "Fall 25",
  "Winter 25",
  "Spring 26",
];

interface CarouselProps {
  viewCount: number;
  setViewCount: React.Dispatch<React.SetStateAction<number>>;
  draggedSearchCourse: any | null;
  expanded: boolean;
}

export default function Carousel({
  viewCount,
  setViewCount,
  draggedSearchCourse,
  expanded,
}: CarouselProps) {
  const [boxIds, setBoxIds] = useState<string[]>([]);
  const [usedSemesters, setUsedSemesters] = useState<string[]>([]);
  const [boxSelections, setBoxSelections] = useState<{
    [boxId: string]: string;
  }>({});
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const { user } = useUser();

  const { currentIndex, next, prev, maxIndex } = CarouselMover(
    allSemesters.length,
    viewCount
  );

  const {
    emptySlots,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    getCoursesForSemester,
    addCourse,
    setPrereqStatus,
  } = CourseDragManager(user?.id ?? "", {
    setSelectedSemester,
    setUsedSemesters,
    courses,
    setCourses,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(
          `http://localhost:3232/get-user-courses-detailed?uid=${user.id}`
        );
        const data = await response.json();
        const semestersData = data.semesters as Record<
          string,
          {
            courseCode: string;
            title: string;
            prereqsMet?: boolean;
            isCapstone?: boolean;
          }[]
        >;

        if (data.response_type === "success") {
          const newBoxIds: string[] = [];
          const newBoxSelections: { [boxId: string]: string } = {};
          const newUsedSemesters: string[] = [];
          const newCourses: CourseItem[] = [];

          let boxCounter = 1;

          const termOrder = ["Spring", "Summer", "Fall", "Winter"];

          const sortedSemesters = Object.entries(semestersData).sort(
            ([a], [b]) => {
              const [termA, yearA] = a.split(" ");
              const [termB, yearB] = b.split(" ");
              const yearDiff = parseInt(yearA) - parseInt(yearB);
              if (yearDiff !== 0) return yearDiff;
              return termOrder.indexOf(termA) - termOrder.indexOf(termB);
            }
          );

          for (const [semester, courseList] of sortedSemesters) {
            const boxId = `box${boxCounter}`;
            newBoxIds.push(boxId);
            newBoxSelections[boxId] = semester;
            newUsedSemesters.push(semester);

            for (const course of courseList) {
              newCourses.push({
                id: `course-${Date.now()}-${Math.random()}`,
                courseCode: course.courseCode,
                title: course.title,
                semesterId: semester,
                isEditing: false,
                prereqsMet: course.prereqsMet ?? false,
                isCapstone: course.isCapstone ?? false,
              });
            }
            boxCounter++;
          }

          setBoxIds(newBoxIds);
          setBoxSelections(newBoxSelections);
          setUsedSemesters(newUsedSemesters);
          setCourses(newCourses);
        } else {
          console.error("Backend error:", data.error);
        }
      } catch (err) {
        console.error("Fetch failed:", err);
      }
    };

    fetchData();
  }, [user?.id]);

  const getAvailableSemesters = () =>
    allSemesters.filter((s) => !usedSemesters.includes(s));

  const handleSemesterSelect = async (boxId: string, semester: string) => {
    setBoxSelections((prev) => ({ ...prev, [boxId]: semester }));
    setUsedSemesters((prev) => [...prev, semester]);
    setSelectedSemester(semester);

    const [term, year] = semester.split(" ");
    if (!user?.id || !term || !year) return;

    try {
      await fetch(
        `http://localhost:3232/add-semester?uid=${user.id}&term=${term}&year=${year}`,
        {
          method: "POST",
        }
      );
    } catch (err) {
      console.error("Error adding semester:", err);
    }
  };

  // const handleSemesterDrop = async (e: React.DragEvent, semesterId: string) => {
  //   e.preventDefault();
  //   const searchCourseRaw = e.dataTransfer.getData("searchCourse");
  //   const courseId = e.dataTransfer.getData("courseId");
  //   if (!user?.id) return;
  //   if (searchCourseRaw) {
  //     const searchCourse = JSON.parse(searchCourseRaw);
  //     const met = await checkPrereqs(
  //       user.id,
  //       searchCourse.courseCode,
  //       semesterId
  //     );

  //     const newCourse: CourseItem = {
  //       id: `course-${Date.now()}`,
  //       courseCode: searchCourse.courseCode,
  //       title: searchCourse.courseName,
  //       semesterId,
  //       isEditing: false,
  //       prereqsMet: met,
  //     };

  //     addCourse(semesterId, newCourse);

  //     setTimeout(() => {
  //       setCourses((prev) => {
  //         const updated = prev.map((course) => {
  //           if (course.id === newCourse.id) {
  //             // ✅ update prereqMet for the new course
  //             return { ...course, prereqMet: true };
  //           }
  //           return course;
  //         });

  //         // ✅ also re-check all other courses
  //         updated.forEach(async (course) => {
  //           const met = await checkPrereqs(
  //             user!.id,
  //             course.courseCode,
  //             course.semesterId
  //           );
  //           setPrereqStatus(course.id, met);
  //         });

  //         return updated;
  //       });
  //     }, 0);

  //     const [term, year] = semesterId.split(" ");
  //     try {
  //       await fetch(
  //         `http://localhost:3232/add-course?uid=${
  //           user?.id
  //         }&code=${encodeURIComponent(
  //           newCourse.courseCode
  //         )}&title=${encodeURIComponent(
  //           newCourse.title
  //         )}&term=${term}&year=${year}`,
  //         { method: "POST" }
  //       );
  //     } catch (err) {
  //       console.error("Error saving course:", err);
  //     }
  //   } else if (courseId) {
  //     handleDrop(e, semesterId);
  //   }
  // };
  // const handleSemesterDrop = async (e: React.DragEvent, semesterId: string) => {
  //   e.preventDefault();
  //   if (!user?.id) return;

  //   const searchCourseRaw = e.dataTransfer.getData("searchCourse");
  //   const courseId = e.dataTransfer.getData("courseId");

  //   if (searchCourseRaw) {
  //     const searchCourse = JSON.parse(searchCourseRaw);

  //     // Check prereqs before creating the course
  //     const met = await checkPrereqs(
  //       user.id,
  //       searchCourse.courseCode,
  //       semesterId
  //     );

  //     const newCourse: CourseItem = {
  //       id: `course-${Date.now()}`,
  //       courseCode: searchCourse.courseCode,
  //       title: searchCourse.courseName,
  //       semesterId,
  //       isEditing: false,
  //       prereqsMet: met,
  //     };

  //     setCourses((prev) => {
  //       const updated = [...prev, newCourse];

  //       updated.forEach(async (course) => {
  //         const met = await checkPrereqs(
  //           user!.id,
  //           course.courseCode,
  //           course.semesterId
  //         );
  //         setPrereqStatus(course.id, met);
  //       });

  //       console.log(
  //         "🔍 Rechecking courses:",
  //         updated.map((c) => c.courseCode)
  //       );
  //       return updated;
  //     });
  //   } else if (courseId) {
  //     handleDrop(e, semesterId);
  //   }
  // };
  // const handleSemesterDrop = async (e: React.DragEvent, semesterId: string) => {
  //   e.preventDefault();
  //   if (!user?.id) return;

  //   const searchCourseRaw = e.dataTransfer.getData("searchCourse");
  //   const courseId = e.dataTransfer.getData("courseId");

  //   if (searchCourseRaw) {
  //     const searchCourse = JSON.parse(searchCourseRaw);

  //     const met = await checkPrereqs(
  //       user.id,
  //       searchCourse.courseCode,
  //       semesterId
  //     );

  //     const newCourse: CourseItem = {
  //       id: `course-${Date.now()}`,
  //       courseCode: searchCourse.courseCode,
  //       title: searchCourse.courseName,
  //       semesterId,
  //       isEditing: false,
  //       prereqsMet: met,
  //     };

  //     addCourse(semesterId, newCourse);

  //     setTimeout(() => {
  //       const current = [...courses, newCourse];
  //       console.log(
  //         "🔁 Rechecking (post-add):",
  //         current.map((c) => c.courseCode)
  //       );

  //       current.forEach(async (course) => {
  //         const met = await checkPrereqs(
  //           user.id!,
  //           course.courseCode,
  //           course.semesterId
  //         );
  //         setPrereqStatus(course.id, met);
  //       });
  //     }, 0);
  //   } else if (courseId) {
  //     handleDrop(e, semesterId);
  //   }
  // };
  const handleSemesterDrop = async (e: React.DragEvent, semesterId: string) => {
    e.preventDefault();
    if (!user?.id) return;

    const searchCourseRaw = e.dataTransfer.getData("searchCourse");
    const courseId = e.dataTransfer.getData("courseId");

    if (searchCourseRaw) {
      const searchCourse = JSON.parse(searchCourseRaw);

      const met = await checkPrereqs(
        user.id,
        searchCourse.courseCode,
        semesterId
      );

      const newCourse: CourseItem = {
        id: `course-${Date.now()}`,
        courseCode: searchCourse.courseCode,
        title: searchCourse.courseName,
        semesterId,
        isEditing: false,
        prereqsMet: met,
      };

      setCourses((prevCourses) => {
        const updated = [...prevCourses, newCourse];
        // Re-check everything with the updated courses array
        updated.forEach(async (c) => {
          const result = await checkPrereqs(
            user.id!,
            c.courseCode,
            c.semesterId
          );
          setPrereqStatus(c.id, result);
        });

        return updated;
      });
    } else if (courseId) {
      handleDrop(e, semesterId);
    }
  };

  const handleSaveCourse = async (
    id: string,
    courseCode: string,
    title: string
  ) => {
    setCourses((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, courseCode, title, isEditing: false } : c
      )
    );

    const course = courses.find((c) => c.id === id);
    if (!course || !user?.id) return;

    const [term, year] = course.semesterId.split(" ");

    try {
      await fetch(
        `http://localhost:3232/add-course?uid=${
          user.id
        }&code=${encodeURIComponent(courseCode)}&title=${encodeURIComponent(
          title
        )}&term=${term}&year=${year}&skipCheck=true`,
        {
          method: "POST",
        }
      );
    } catch (err) {
      console.error("Error updating course:", err);
    }
  };

  // useEffect(() => {
  //   const handleRemoveCourse = (e: any) => {
  //     const { courseCode, semesterId } = e.detail;

  //     console.log("📥 removeCourse event received:", courseCode, semesterId);

  //     if (!user?.id) return;

  //     // setCourses((prev) => {
  //     //   const updated = prev.filter(
  //     //     (c) => !(c.courseCode === courseCode && c.semesterId === semesterId)
  //     //   );

  //     //   // Re-check prereqs for all remaining courses
  //     //   updated.forEach(async (course) => {
  //     //     const met = await checkPrereqs(
  //     //       user.id!,
  //     //       course.courseCode,
  //     //       course.semesterId
  //     //     );
  //     //     setPrereqStatus(course.id, met);
  //     //   });

  //     //   return updated;
  //     // });
  //     setCourses((prev) => {
  //       const updated = prev.filter(
  //         (c) => !(c.courseCode === courseCode && c.semesterId === semesterId)
  //       );

  //       // Schedule recheck for next tick so state is updated
  //       setTimeout(() => {
  //         console.log(
  //           "🔁 Rechecking after removal:",
  //           updated.map((c) => c.courseCode)
  //         );
  //         updated.forEach(async (course) => {
  //           const met = await checkPrereqs(
  //             user!.id,
  //             course.courseCode,
  //             course.semesterId
  //           );
  //           setPrereqStatus(course.id, met);
  //         });
  //       }, 0);

  //       return updated;
  //     });
  //   };

  //   window.addEventListener("removeCourse", handleRemoveCourse);
  //   return () => window.removeEventListener("removeCourse", handleRemoveCourse);
  // }, [user?.id, setCourses, setPrereqStatus]);

  useEffect(() => {
    const handleRemoveCourse = (e: any) => {
      const { courseCode, semesterId } = e.detail;

      console.log("📥 removeCourse event received:", courseCode, semesterId);
      if (!user?.id) return;

      setCourses((prev) => {
        const updated = prev.filter(
          (c) => !(c.courseCode === courseCode && c.semesterId === semesterId)
        );

        // Re-check everything after removing
        updated.forEach(async (course) => {
          const met = await checkPrereqs(
            user!.id,
            course.courseCode,
            course.semesterId
          );
          setPrereqStatus(course.id, met);
        });

        return updated;
      });
    };

    window.addEventListener("removeCourse", handleRemoveCourse);
    return () => window.removeEventListener("removeCourse", handleRemoveCourse);
  }, [user?.id, setCourses, setPrereqStatus]);

  const handleAddSemester = () => {
    const newBoxId = `box${boxIds.length + 1}`;
    setBoxIds((prev) => [...prev, newBoxId]);
  };

  const boxWidth = expanded ? 270 : 320;

  return (
    <div className="carousel-outer-wrapper">
      <button
        className="carousel-button left"
        onClick={prev}
        disabled={currentIndex === 0}
      >
        ‹
      </button>

      <div className="carousel-inner-wrapper">
        <div
          className="carousel-track"
          style={{
            transform: `translateX(-${currentIndex * boxWidth}px)`,
            transition: "transform 0.5s ease",
          }}
        >
          {boxIds.map((boxId) => (
            <SemesterBox
              key={boxId}
              boxId={boxId}
              selectedSemester={boxSelections[boxId] || ""}
              availableSemesters={getAvailableSemesters()}
              onSemesterSelect={handleSemesterSelect}
              onDragOver={handleDragOver}
              onDrop={(e) =>
                boxSelections[boxId] &&
                handleSemesterDrop(e, boxSelections[boxId])
              }
              expanded={expanded}
            >
              {boxSelections[boxId] &&
                getCoursesForSemester(boxSelections[boxId]).map((course) => (
                  <CourseDrag
                    key={course.id}
                    id={course.id}
                    courseCode={course.courseCode}
                    courseTitle={course.title}
                    semesterId={boxSelections[boxId]}
                    isEmpty={false}
                    isEditing={course.isEditing}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onSaveCourse={handleSaveCourse}
                    prereqsMet={course.prereqsMet ?? false}
                    isCapstone={course.isCapstone ?? false}
                  />
                ))}
              <button
                className="add-course-button"
                onClick={() =>
                  addCourse(boxSelections[boxId], undefined, "new")
                }
              >
                + New course
              </button>
            </SemesterBox>
          ))}

          <div className={`add-box ${expanded ? "expanded" : "collapsed"}`}>
            <button className="add-button" onClick={handleAddSemester}>
              <div className="add-button-plus">+</div>
              <div>New Semester</div>
            </button>
          </div>
        </div>
      </div>

      <button
        className="carousel-button right"
        onClick={next}
        disabled={currentIndex === maxIndex}
      >
        ›
      </button>
    </div>
  );
}
