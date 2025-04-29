import { Dispatch, SetStateAction } from "react";
import SemesterBox from "./SemesterBox";
import CourseSlot from "./CourseDrag";
import { CarouselMover } from "../hooks/CarouselMover.ts";
import { CourseDragManager } from "../hooks/CourseDragManager.ts";
import "../styles/Carousel.css";
import "../styles/SemesterBox.css";

interface Course {
  id: string;
  courseCode: string;
  courseTitle: string;
  semesterId: string;
}

interface CarouselProps {
  viewCount: number;
  setViewCount: Dispatch<SetStateAction<number>>;
  semesters: string[];
  draggedSearchCourse: any | null;
  expanded: boolean;
}

export default function Carousel({
  viewCount,
  setViewCount,
  semesters,
  draggedSearchCourse,
  expanded,
}: CarouselProps) {
  const { currentIndex, next, prev, maxIndex } = CarouselMover(
    semesters.length,
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
  } = CourseDragManager([
    {
      id: "course-1",
      courseCode: "CSCI 1430",
      courseTitle: "Computer Vision",
      semesterId: "spring-2027",
    },
  ]);

  const handleSemesterDrop = (e: React.DragEvent, semesterId: string) => {
    e.preventDefault();

    const courseId = e.dataTransfer.getData("courseId");
    const searchCourseRaw = e.dataTransfer.getData("searchCourse");

    if (searchCourseRaw) {
      const searchCourse = JSON.parse(searchCourseRaw);

      const newCourse: Course = {
        id: `search-${Date.now()}`,
        courseCode: searchCourse.courseCode,
        courseTitle: searchCourse.courseName,
        semesterId,
      };

      setCourses((prev) => [...prev, newCourse]);
    } else if (courseId) {
      // Moving existing course
      handleDrop(e, semesterId);
    }
  };

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
            transform: `translateX(-${(100 / viewCount) * currentIndex}%)`,
          }}
        >
          {semesters.map((semesterId) => (
            <SemesterBox
              key={semesterId}
              title={semesterId.toUpperCase()}
              onDragOver={handleDragOver}
              onDrop={(e) => handleSemesterDrop(e, semesterId)}
              expanded={expanded}
            >
              {getCoursesForSemester(semesterId).map((course) => (
                <CourseSlot
                  key={course.id}
                  id={course.id}
                  courseCode={course.courseCode}
                  courseTitle={course.courseTitle}
                  isEmpty={false}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              ))}
              {Array(emptySlots[semesterId] || 0)
                .fill(0)
                .map((_, i) => (
                  <CourseSlot
                    key={`empty-${semesterId}-${i}`}
                    id={`empty-${semesterId}-${i}`}
                    courseCode=""
                    courseTitle=""
                    isEmpty={true}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleSemesterDrop(e, semesterId)}
                  />
                ))}
              <button
                className="add-course-button"
                onClick={() => addCourse(semesterId)}
              >
                + New course
              </button>
            </SemesterBox>
          ))}
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
