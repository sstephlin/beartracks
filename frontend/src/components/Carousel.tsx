import { useState, useEffect } from "react";
import SemesterBox from "./SemesterBox";
import CourseDrag from "./CourseDrag";
import { CarouselMover } from "../hooks/CarouselMover.ts";
import { CourseDragManager } from "../hooks/CourseDragManager.ts";
import "../styles/Carousel.css";
import "../styles/SemesterBox.css";

interface CarouselProps {
  viewCount: number;
  setViewCount: React.Dispatch<React.SetStateAction<number>>;
  draggedSearchCourse: any | null;
  expanded: boolean;
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

export default function Carousel({
  viewCount,
  setViewCount,
  draggedSearchCourse,
  expanded,
}: CarouselProps) {
  const { currentIndex, next, prev, maxIndex } = CarouselMover(
    allSemesters.length,
    viewCount
  );

  const {
    courses,
    emptySlots,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    getCoursesForSemester,
    addCourse,
    setCourses,
  } = CourseDragManager([]);

  const [boxIds, setBoxIds] = useState<string[]>(["box1", "box2"]);
  const [usedSemesters, setUsedSemesters] = useState<string[]>([]);
  const [boxSelections, setBoxSelections] = useState<{
    [boxId: string]: string;
  }>({});

  useEffect(() => {
    const handleRemoveCourse = (e: any) => {
      const { courseId, semesterId } = e.detail;
      console.log("Removing courseId:", courseId, "semesterId:", semesterId);

      setCourses((prev) =>
        prev.filter(
          (course) =>
            !(course.id === courseId && course.semesterId === semesterId)
        )
      );
    };

    window.addEventListener("removeCourse", handleRemoveCourse);

    return () => {
      window.removeEventListener("removeCourse", handleRemoveCourse);
    };
  }, [setCourses]);

  const getAvailableSemesters = () =>
    allSemesters.filter((sem) => !usedSemesters.includes(sem));

  const handleSemesterSelect = (boxId: string, semester: string) => {
    setBoxSelections((prev) => ({ ...prev, [boxId]: semester }));
    setUsedSemesters((prev) => [...prev, semester]);
  };

  const handleSemesterDrop = (e: React.DragEvent, semesterId: string) => {
    e.preventDefault();

    const courseId = e.dataTransfer.getData("courseId");
    const searchCourseRaw = e.dataTransfer.getData("searchCourse");

    if (searchCourseRaw) {
      const searchCourse = JSON.parse(searchCourseRaw);
      const newCourse = {
        id: `search-${Date.now()}`,
        courseCode: searchCourse.courseCode,
        courseTitle: searchCourse.courseName,
        semesterId,
      };
      setCourses((prev) => [...prev, newCourse]);
    } else if (courseId) {
      handleDrop(e, semesterId);
    }
  };

  const handleSaveCourse = async (
    id: string,
    courseCode: string,
    courseTitle: string
  ) => {
    setCourses((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, courseCode, courseTitle, isEditing: false } : c
      )
    );

    const uid = "test"; // Replace with real UID
    const course = courses.find((c) => c.id === id);
    const term = course?.semesterId.split(" ")[0];
    const year = course?.semesterId.split(" ")[1];

    try {
      await fetch(
        `http://localhost:1234/add-course?uid=${uid}&code=${encodeURIComponent(
          courseCode
        )}&title=${encodeURIComponent(courseTitle)}&term=${term}&year=${year}`,
        { method: "POST" }
      );
    } catch (err) {
      console.error("Failed to add course:", err);
    }
  };

  const handleAddSemester = () => {
    const newBoxId = `box${boxIds.length + 1}`;
    setBoxIds((prevBoxIds) => [...prevBoxIds, newBoxId]);
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
              onDrop={(e) => {
                const selected = boxSelections[boxId];
                if (selected) handleSemesterDrop(e, selected);
              }}
              expanded={expanded}
            >
              {(boxSelections[boxId] &&
                getCoursesForSemester(boxSelections[boxId]).map((course) => (
                  <CourseDrag
                    key={course.id}
                    id={course.id}
                    courseCode={course.courseCode}
                    courseTitle={course.courseTitle}
                    semesterId={boxSelections[boxId]}
                    isEmpty={false}
                    isEditing={course.isEditing}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onSaveCourse={handleSaveCourse}
                  />
                ))) ||
                null}

              {boxSelections[boxId] &&
                Array(emptySlots[boxSelections[boxId]] || 0)
                  .fill(0)
                  .map((_, i) => (
                    <CourseDrag
                      key={`empty-${boxId}-${i}`}
                      id={`empty-${boxId}-${i}`}
                      courseCode=""
                      courseTitle=""
                      semesterId={boxSelections[boxId]}
                      isEmpty={true}
                      onDragOver={handleDragOver}
                      onDrop={(e) =>
                        handleSemesterDrop(e, boxSelections[boxId])
                      }
                    />
                  ))}

              {boxSelections[boxId] && (
                <button
                  className="add-course-button"
                  onClick={() => addCourse(boxSelections[boxId])}
                >
                  + New course
                </button>
              )}
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
