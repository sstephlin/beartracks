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
import { Award } from "lucide-react";

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

// interface CarouselProps {
//   viewCount: number;
//   setViewCount: React.Dispatch<React.SetStateAction<number>>;
//   draggedSearchCourse: any | null;
//   expanded: boolean;
// }

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
  
  const [capstoneCodes, setCapstoneCodes] = useState<Set<string>>(new Set());
  const [dropError, setDropError] = useState<{message: string, semesterId: string} | null>(null);
  const [draggedCourse, setDraggedCourse] = useState<{courseCode: string, isFromSearch: boolean} | null>(null);
  const [hoveredSemester, setHoveredSemester] = useState<string | null>(null);
  const [courseAvailabilityCache, setCourseAvailabilityCache] = useState<{
    [courseCode: string]: string[];
  }>({});
  const [capstoneCourseId, setCapstoneCourseId] = useState<string | null>(null);


  const { currentIndex, next, prev, maxIndex } = CarouselMover(
    allSemesters.length,
    viewCount
  );

  // const handleToggleCapstone = (id: string, newValue: boolean) => {
  //   setCourses((prev) =>
  //     prev.map((course) =>
  //       course.id === id ? { ...course, isCapstone: newValue } : course
  //     )
  //   );
  // };

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

  const handleToggleCapstone = async (courseId: string, checked: boolean) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course || !user?.id) return;
  
    const { courseCode, semesterId } = course;
    const [term, year] = semesterId.split(" ");
    const semester = `${term} ${year}`;
  
    try {
      if (checked) {
        // User marked this course as their capstone
        await fetch(
          `http://localhost:3232/update-capstone?uid=${user.id}&semester=${encodeURIComponent(
            semester
          )}&courseCode=${encodeURIComponent(courseCode)}`,
          { method: "POST" }
        );
  
        // Update frontend state: only one course can be capstone
        setCourses((prev) =>
          prev.map((c) =>
            c.semesterId === semester
              ? { ...c, isCapstone: c.id === courseId }
              : c
          )
        );
      } else {
        // User unchecked — clear capstone
        setCourses((prev) =>
          prev.map((c) =>
            c.id === courseId ? { ...c, isCapstone: false } : c
          )
        );
      }
    } catch (err) {
      console.error("❌ Failed to update capstone:", err);
    }
  };

  useEffect(() => {
    const fetchCapstones = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`http://localhost:3232/check-capstones?uid=${user.id}`);
        const data = await res.json();
        if (data.user_capstone_eligible_courses) {
          setCapstoneCodes(new Set(data.user_capstone_eligible_courses));
        }
      } catch (err) {
        console.error("failed to fetch capstones", err);
      }
    };
    fetchCapstones();
  }, [user?.id]);


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
          const savedCapstone = newCourses.find(c => c.isCapstone);
          if (savedCapstone) {
            setCapstoneCourseId(savedCapstone.id);
          }
          
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

  // Fetch all course availability data when component mounts
  useEffect(() => {
    const fetchCourseAvailability = async () => {
      try {
        const response = await fetch('http://localhost:3232/get-all-course-availability');
        const data = await response.json();
        
        if (data.result === "success") {
          setCourseAvailabilityCache(data.availability);
        }
      } catch (err) {
        console.error("Error fetching course availability:", err);
      }
    };

    fetchCourseAvailability();
  }, []);

  const checkCourseOfferedInSemester = async (courseCode: string, semester: string): Promise<boolean> => {
    // First check the cache
    if (courseAvailabilityCache[courseCode]) {
      return courseAvailabilityCache[courseCode].includes(semester);
    }

    // If not in cache, fetch and update cache
    try {
      const response = await fetch(
        `http://localhost:3232/check-semester?courseCode=${encodeURIComponent(courseCode)}`
      );
      const data = await response.json();
      
      if (data.result === "success") {
        const offeredSemesters = data.offeredSemesters as string[];
        // Update cache
        setCourseAvailabilityCache(prev => ({
          ...prev,
          [courseCode]: offeredSemesters
        }));
        return offeredSemesters.includes(semester);
      }
      return false;
    } catch (err) {
      console.error("Error checking semester:", err);
      return false;
    }
  };

  const handleCourseDragStart = (e: React.DragEvent, courseCode: string, isFromSearch: boolean) => {
    setDraggedCourse({ courseCode, isFromSearch });
    handleDragStart(e, { courseCode, title: "", semesterId: "" });
  };

  const handleSearchCourseDragStart = (e: CustomEvent) => {
    const { course } = e.detail;
    setDraggedCourse({ courseCode: course.courseCode, isFromSearch: true });
  };

  const handleCourseDragEnd = (e: React.DragEvent) => {
    setDraggedCourse(null);
    setDropError(null);
    handleDragEnd(e);
  };

  const handleDragOverSemester = async (e: React.DragEvent, semesterId: string) => {
    e.preventDefault();
    if (!user?.id || !draggedCourse) return;

    // Check if course already exists in target semester
    const courseAlreadyExists = courses.some(
      course => course.courseCode === draggedCourse.courseCode && course.semesterId === semesterId
    );

    if (courseAlreadyExists) {
      setDropError({ message: "Course already exists in this semester", semesterId });
      return;
    }

    const isOffered = await checkCourseOfferedInSemester(draggedCourse.courseCode, semesterId);
    if (!isOffered) {
      setDropError({ message: "Course not offered in this semester", semesterId });
    } else {
      setDropError(null);
    }
  };

  const handleDragLeave = () => {
    setDropError(null);
  };

  const handleSemesterDrop = async (e: React.DragEvent, semesterId: string) => {
    e.preventDefault();
    if (!user?.id) return;

    const searchCourseRaw = e.dataTransfer.getData("searchCourse");
    const courseId = e.dataTransfer.getData("courseId");
    const courseCode = e.dataTransfer.getData("courseCode");
    const title = e.dataTransfer.getData("title");
    const sourceSemesterId = e.dataTransfer.getData("semesterId");

    // Don't do anything if dropping on the same semester
    if (sourceSemesterId === semesterId) {
      return;
    }

    // Check if course already exists in target semester
    const courseAlreadyExists = courses.some(
      course => course.courseCode === (searchCourseRaw ? JSON.parse(searchCourseRaw).courseCode : courseCode) 
      && course.semesterId === semesterId
    );

    if (courseAlreadyExists) {
      setDropError({ message: "Course already exists in this semester", semesterId });
      setTimeout(() => setDropError(null), 3000);
      return;
    }

    if (searchCourseRaw) {
      const searchCourse = JSON.parse(searchCourseRaw);
      
      // Check if course is offered in this semester
      const isOffered = await checkCourseOfferedInSemester(searchCourse.courseCode, semesterId);
      if (!isOffered) {
        setDropError({ message: "Course not offered in this semester", semesterId });
        setTimeout(() => setDropError(null), 3000);
        return;
      }

      // Check prerequisites first
      const met = await checkPrereqs(
        user.id,
        searchCourse.courseCode,
        semesterId
      );

      const isCapstone = capstoneCodes.has(searchCourse.courseCode);

      const newCourse: CourseItem = {
        id: `course-${Date.now()}`,
        courseCode: searchCourse.courseCode,
        title: searchCourse.courseName,
        semesterId,
        isEditing: false,
        prereqsMet: met,
        isCapstone,
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
          )}&term=${term}&year=${year}` ,
          { method: "POST" }
        );

        console.log("✅ Added course from search to semester in backend");

        // // add another fetch to check capstones 
        // //get JSON list, and save it for the user
        // // since we are still in the try block/constant, we can always reference the current course add
        // // use if statement, if added course was in constant, then add a star top right
        // useEffect(() => {
        //   const fetchCapstones = async () => {
        //     try {
        //       const res = await fetch(
        //         `http://localhost:3232/check-capstones?uid=${user.id}`
        //       );
        //       const data = await res.json();
        //       if (data.user_capstone_eligible_courses) {
        //         setCapstoneCodes(new Set(data.user_capstone_eligible_courses));
        //       }
        //     } catch (err) {
        //       console.error("failed to fetch capstones", err);
        //     }
        //   };
        //   fetchCapstones();
        // }, []);

        // if (capstoneCodes.has(searchCourse.courseCode)) {

        // }

        // Now recheck all prerequisites with the updated courses
        setTimeout(() => {
          recheckAllPrereqs(updatedCourses);
        }, 100);
      } catch (err) {
        console.error("Failed to sync course to backend:", err);
      }
    } else if (courseId || (courseCode && sourceSemesterId)) {
      // This is for moving existing courses between semesters
      const course = courses.find(c => c.id === courseId || (c.courseCode === courseCode && c.semesterId === sourceSemesterId));
      if (!course) return;

      // Check if course is offered in the target semester
      const isOffered = await checkCourseOfferedInSemester(course.courseCode, semesterId);
      if (!isOffered) {
        setDropError({ message: "Course not offered in this semester", semesterId });
        setTimeout(() => setDropError(null), 3000);
        return;
      }

      // Get the old semester info for deletion
      const [oldTerm, oldYear] = course.semesterId.split(" ");

      // Update the course's semester in state
      setCourses(prevCourses => 
        prevCourses.map(c => 
          c.id === course.id ? { ...c, semesterId } : c
        )
      );

      // Get the new semester info
      const [newTerm, newYear] = semesterId.split(" ");

      try {
        // First, delete the course from the old semester
        await fetch(
          `http://localhost:3232/remove-course?uid=${
            user.id
          }&code=${encodeURIComponent(course.courseCode)}&term=${oldTerm}&year=${oldYear}`,
          { method: "POST" }
        );

        console.log("✅ Removed course from old semester in backend");

        // Then, add it to the new semester
        await fetch(
          `http://localhost:3232/add-course?uid=${
            user.id
          }&code=${encodeURIComponent(course.courseCode)}&title=${encodeURIComponent(
            course.title
          )}&term=${newTerm}&year=${newYear}`,
          { method: "POST" }
        );

        console.log("✅ Added course to new semester in backend");

        // Recheck prerequisites
        setTimeout(() => {
          recheckAllPrereqs(courses);
        }, 100);
      } catch (err) {
        console.error("Failed to sync course move to backend:", err);
      }
    }
  };

  const handleSaveCourse = async (
    id: string,
    courseCode: string,
    title: string
  ) => {
    // If both fields are empty, remove the course
    if (!courseCode.trim() && !title.trim()) {
      setCourses(prev => prev.filter(c => c.id !== id));
      return;
    }

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

  useEffect(() => {
    window.addEventListener("searchCourseDragStart", handleSearchCourseDragStart as EventListener);
    return () => {
      window.removeEventListener("searchCourseDragStart", handleSearchCourseDragStart as EventListener);
    };
  }, []);

  return (
    <div className={`carousel-outer-wrapper ${viewCount === 2 ? "two" : "four"}`}>
      {dropError && (
        <div className="drop-error-message">
          {dropError.message}
        </div>
      )}
      
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
              onDragOver={(e) => boxSelections[boxId] && handleDragOverSemester(e, boxSelections[boxId])}
              onDragLeave={handleDragLeave}
              onDrop={(e) =>
                boxSelections[boxId] &&
                handleSemesterDrop(e, boxSelections[boxId])
              }
              expanded={expanded}
              onRightClick={(e) => handleRightClick(e, boxId)}
              errorMessage={dropError && dropError.semesterId === boxSelections[boxId] ? dropError.message : null}
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
                    onDragStart={(e) => handleCourseDragStart(e, course.courseCode, false)}
                    onDragEnd={handleCourseDragEnd}
                    onSaveCourse={handleSaveCourse}
                    prereqsMet={course.prereqsMet ?? false}
                    isCapstone={course.id === capstoneCourseId}
                    onToggleCapstone={(id, checked) => {
                      const newCapstoneId = checked ? id : null;
                      setCapstoneCourseId(newCapstoneId); // ensure only one selected

                      const updatedCourses = courses.map(c =>
                        ({ ...c, isCapstone: c.id === newCapstoneId })
                      );
                      setCourses(updatedCourses);
                      

                      // backend call
                      if (checked) {
                        const selectedCourse = courses.find(c => c.id === id);
                        if (selectedCourse) {
                          const [term, year] = selectedCourse.semesterId.split(" ");
                          fetch(`http://localhost:3232/update-capstone?uid=${user?.id}&semester=${term} ${year}&courseCode=${selectedCourse.courseCode}`, {
                            method: "POST"
                          }).then(res => res.json()).then(data => {
                            console.log("✅ Updated capstone in backend", data);
                          });
                        }
                      }
                    }}

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
