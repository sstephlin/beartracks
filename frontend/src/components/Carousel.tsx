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
import RightClickComponent from "./RightClick.tsx";

interface CarouselProps {
  viewCount: number;
  setViewCount: React.Dispatch<React.SetStateAction<number>>;
  draggedSearchCourse: any | null;
  expanded: boolean; // uid: string | undefined;
}

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
  // const [boxIds, setBoxIds] = useState<number[]>([]);
  // const [usedSemesters, setUsedSemesters] = useState<string[]>([]);
  // const [boxSelections, setBoxSelections] = useState<{
  //   [boxId: string]: string;
  // }>({});
  const [boxIds, setBoxIds] = useState<string[]>(["1"]);
  const [usedSemesters, setUsedSemesters] = useState<string[]>([]);
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);
  const [boxSelections, setBoxSelections] = useState<{
    [boxId: string]: string;
  }>({});
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const { user } = useUser();
  const [showManualAddDisclaimer, setShowManualAddDisclaimer] = useState(false);

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
    recheckAllPrereqs,
  } = CourseDragManager(user?.id ?? "", {
    setSelectedSemester,
    setUsedSemesters,
    courses,
    setCourses,
  });

  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleRightClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    boxId: string
  ) => {
    event.preventDefault();
    setSelectedBoxId(boxId);
    setMenuPosition({
      x: event.pageX,
      y: event.pageY,
    });
    console.log("boxid", boxId);
  };

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
            const boxId = `${boxCounter}`;
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
      console.error("Network error while adding semester:", err);
    }
  };
  useEffect(() => {
    const handleClickOutside = () => {
      setMenuPosition(null);
      setSelectedBoxId(null);
    };

    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

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

  //     setCourses((prevCourses) => {
  //       const updated = [...prevCourses, newCourse];
  //       return updated;
  //     });

  //     // Recheck all prerequisites after adding a new course
  //     setTimeout(() => {
  //       // Re-check everything with the updated courses array
  //       if (recheckAllPrereqs) {
  //         recheckAllPrereqs([...courses]);
  //       } else {
  //         courses.forEach(async (c) => {
  //           const result = await checkPrereqs(
  //             user.id!,
  //             c.courseCode,
  //             c.semesterId
  //           );
  //           setPrereqStatus(c.id, result);
  //           console.log("checking prereq for course", c, "result: ", result);
  //         });
  //       }
  //     }, 100);
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

      // Check prerequisites first
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

      // Get the updated state using a promise
      const updatedCourses = await new Promise<CourseItem[]>((resolve) => {
        setCourses((prevCourses) => {
          const updated = [...prevCourses, newCourse];
          resolve(updated);
          return updated;
        });
      });

      // Immediately sync with backend for search results
      const [term, year] = semesterId.split(" ");
      try {
        await fetch(
          `http://localhost:3232/add-course?uid=${
            user.id
          }&code=${encodeURIComponent(
            searchCourse.courseCode
          )}&title=${encodeURIComponent(
            searchCourse.courseName
          )}&term=${term}&year=${year}`,
          { method: "POST" }
        );

        console.log("✅ Added course from search to semester in backend");

        // Now recheck all prerequisites with the updated courses
        setTimeout(() => {
          recheckAllPrereqs(updatedCourses);
        }, 100);
      } catch (err) {
        console.error("Failed to sync course to backend:", err);
      }
    } else if (courseId) {
      // This is for moving existing courses between semesters
      handleDrop(e, semesterId);
    }
  };

  const handleSaveCourse = async (
    id: string,
    courseCode: string,
    title: string
  ) => {
    // Get the updated state using a promise
    const updatedCourses = await new Promise<CourseItem[]>((resolve) => {
      setCourses((prev) => {
        const updated = prev.map((c) =>
          c.id === id ? { ...c, courseCode, title, isEditing: false } : c
        );
        resolve(updated);
        return updated;
      });
    });

    const course = updatedCourses.find((c) => c.id === id);
    if (!course || !user?.id) return;

    const [term, year] = course.semesterId.split(" ");

    try {
      // Sync to backend
      await fetch(
        `http://localhost:3232/add-course?uid=${
          user.id
        }&code=${encodeURIComponent(courseCode)}&title=${encodeURIComponent(
          title
        )}&term=${term}&year=${year}`,
        {
          method: "POST",
        }
      );

      console.log("✅ Saved course to backend:", courseCode);

      // Now recheck all prerequisites with the updated courses
      setTimeout(() => {
        recheckAllPrereqs(updatedCourses);
      }, 100);
    } catch (err) {
      console.error("Error updating course:", err);
    }
  };

  // const handleSaveCourse = async (
  //   id: string,
  //   courseCode: string,
  //   title: string
  // ) => {
  //   setCourses((prev) =>
  //     prev.map((c) =>
  //       c.id === id ? { ...c, courseCode, title, isEditing: false } : c
  //     )
  //   );

  //   const course = courses.find((c) => c.id === id);
  //   if (!course || !user?.id) return;

  //   const [term, year] = course.semesterId.split(" ");

  //   try {
  //     await fetch(
  //       `http://localhost:3232/add-course?uid=${
  //         user.id
  //       }&code=${encodeURIComponent(courseCode)}&title=${encodeURIComponent(
  //         title
  //       )}&term=${term}&year=${year}&skipCheck=true`,
  //       {
  //         method: "POST",
  //       }
  //     );

  //     // Recheck all prerequisites after saving a course
  //     setTimeout(() => {
  //       if (recheckAllPrereqs) {
  //         recheckAllPrereqs([...courses]);
  //       }
  //     }, 100);
  //   } catch (err) {
  //     console.error("Error updating course:", err);
  //   }
  // };

  useEffect(() => {
    const handleRemoveCourse = (e: any) => {
      const { courseCode, semesterId } = e.detail;

      console.log("📥 removeCourse event received:", courseCode, semesterId);
      if (!user?.id) return;

      setCourses((prev) => {
        const updated = prev.filter(
          (c) => !(c.courseCode === courseCode && c.semesterId === semesterId)
        );

        // Recheck all prerequisites after course removal
        // BUT use the updated courses array that no longer includes the deleted course
        setTimeout(() => {
          if (recheckAllPrereqs) {
            recheckAllPrereqs(updated);
          } else {
            updated.forEach(async (course) => {
              const result = await checkPrereqs(
                user!.id,
                course.courseCode,
                course.semesterId
              );
              setPrereqStatus(course.id, result);
            });
          }
        }, 100);

        return updated;
      });
    };

    window.addEventListener("removeCourse", handleRemoveCourse);
    return () => window.removeEventListener("removeCourse", handleRemoveCourse);
  }, [user?.id, setPrereqStatus, recheckAllPrereqs]);

  const handleAddRightSemester = (currSemNum: string) => {
    let newID = "";
    let index = boxIds.indexOf(`${currSemNum}`);
    if (currSemNum === "0") {
      newID = "1";
      index = 0;
    } else if (index === -1) return boxIds; // invalid semester id
    else {
      newID = (Math.max(...boxIds.map(Number)) + 1).toString();
    }

    const newBoxIds = [...boxIds];
    newBoxIds.splice(index + 1, 0, newID);
    setBoxIds(newBoxIds);
    console.log("right");
  };

  const handleAddLeftSemester = (currSemNum: string) => {
    const index = boxIds.indexOf(`${currSemNum}`);
    if (index === -1) return boxIds; // invalid semester id
    const newID = (Math.max(...boxIds.map(Number)) + 1).toString();

    const newBoxIds = [...boxIds];
    newBoxIds.splice(index, 0, newID);
    setBoxIds(newBoxIds);
    console.log("newId", Math.max(...boxIds.map(Number)) + 1);
    console.log("newIds", newBoxIds);
  };

  const handleDeleteSemester = (semToDelete: string) => {
    setBoxIds((prevBoxIds) => prevBoxIds.filter((id) => id !== semToDelete));
    console.log("delete");
  };

  const boxWidth = expanded ? 270 : 320;

  return (
    <div
      className={`carousel-outer-wrapper ${viewCount === 2 ? "two" : "four"}`}
    >
            
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
              onSemesterSelect={() => handleSemesterSelect(boxId, "")}
              onDragOver={handleDragOver}
              onDrop={(e) =>
                boxSelections[boxId] &&
                handleSemesterDrop(e, boxSelections[boxId])
              }
              expanded={expanded}
              onRightClick={(e) => handleRightClick(e, boxId)}
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
                        
            <button
              className="add-button"
              onClick={() =>
                handleAddRightSemester(
                  boxIds.length >= 1 ? boxIds[boxIds.length - 1] : "0"
                )
              }
            >
                            <div className="add-button-plus">+</div>
                            <div>New Semester</div>
                          
            </button>
                      
          </div>
                  
        </div>
                {/* Context menu rendered globally once */}
                
        {menuPosition && selectedBoxId !== null && (
          <RightClickComponent
            position={menuPosition}
            onAddRightSemester={() => handleAddRightSemester(selectedBoxId)}
            onAddLeftSemester={() => handleAddLeftSemester(selectedBoxId)}
            onDeleteSemester={() => handleDeleteSemester(selectedBoxId)}
          />
        )}
              
      </div>
            
      <button
        className="carousel-button right"
        onClick={next}
        disabled={currentIndex === maxIndex}
      >
                ›       
      </button>
      {showManualAddDisclaimer && (
        <div
          className="disclaimer-overlay"
          onClick={(e) => {
            if (
              (e.target as HTMLElement).classList.contains("disclaimer-overlay")
            ) {
              setShowManualAddDisclaimer(false);
            }
          }}
        >
          <div className="disclaimer-box">
            <button
              className="close-disclaimer"
              onClick={() => setShowManualAddDisclaimer(false)}
            >
              ×
            </button>
            <h2>Manual Course Entry</h2>
            <p>
              You're manually adding a course. After clicking, you can enter
              course details like the code and name. Use this for Non-CS
              courses. Please not that these courses will not be tracked on your
              prgoression meter.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
