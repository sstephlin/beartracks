import { useState, useEffect } from "react";
import SemesterBox from "./SemesterBox";
import CourseDrag from "./CourseDrag";
import RightClick from "./RightClick.tsx";
import { CarouselMover } from "../hooks/CarouselMover.ts";
import { CourseDragManager } from "../hooks/CourseDragManager.ts";
import "../styles/Carousel.css";
import "../styles/SemesterBox.css";
import { useUser } from "@clerk/clerk-react";
import { checkPrereqs } from "../utils/prereqUtils";
import { CourseItem } from "../types";
import RightClickComponent from "./RightClick.tsx";

interface CarouselProps {
  viewCount: number;
  setViewCount: React.Dispatch<React.SetStateAction<number>>;
  draggedSearchCourse: any | null;
  expanded: boolean;
  uid: string | undefined;
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
  const { user } = useUser();

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
    setPrereqStatus,
  } = CourseDragManager([]);

  const [boxIds, setBoxIds] = useState<number[]>([1]);
  const [usedSemesters, setUsedSemesters] = useState<string[]>([]);
  const [selectedBoxId, setSelectedBoxId] = useState<number | null>(null);
  const [boxSelections, setBoxSelections] = useState<{
    [boxId: string]: string;
  }>({});
  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const handleRightClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    boxId: number
  ) => {
    // event.prevent
    // const handleRightClick = (
    event.preventDefault();

    setSelectedBoxId(boxId);
    setMenuPosition({
      x: event.pageX,
      y: event.pageY,

      // Prevent the default browser right-click menu

      // // Get the bounding rectangle of the clicked div (specific to the box clicked)
      // const rect = event.currentTarget.getBoundingClientRect();

      // // Calculate mouse position relative to the div
      // const xPos = event.pageX; // Adjust for scroll
      // const yPos = event.pageY; // Adjust for scroll

      // // Optional: Add checks to prevent menu  from going off-screen
      // // const maxX = window.innerWidth - 220; // Menu width (220px)
      // // const maxY = window.innerHeight - 150; // Menu height (150px)

      // // Set the menu position based on mouse position
      // setMenuPosition({
      //   x: xPos,
      //   y: yPos,
      //   // x: Math.min(xPos, maxX), // Ensure menu is within the viewport bounds
      //   // y: Math.min(yPos, maxY),
    });

    console.log(`Right-clicked on box: ${boxId}`); // Debug which box was clicked
    console.log(rect);
    console.log("pos", xPos, yPos);
    console.log("mouse", event.clientX, event.clientY);
  };

  useEffect(() => {
    const handleRemoveCourse = async (e: any) => {
      const { courseCode, semesterId } = e.detail;
      console.log("Removing", courseCode, "from", semesterId);

      if (!user?.id) return;

      // 1) Remove locally and get the updated list
      setCourses((prev) => {
        const updated = prev.filter(
          (c) => !(c.courseCode === courseCode && c.semesterId === semesterId)
        );

        // 2) Re-check prereqs on the new list
        updated.forEach(async (c) => {
          const met = await checkPrereqs(user.id, c.courseCode, c.semesterId);
          setPrereqStatus(c.id, met);
        });

        return updated;
      });
    };

    window.addEventListener("removeCourse", handleRemoveCourse);
    return () => {
      window.removeEventListener("removeCourse", handleRemoveCourse);
    };
  }, [user?.id, setPrereqStatus, setCourses]);

  const getAvailableSemesters = () =>
    allSemesters.filter((sem) => !usedSemesters.includes(sem));

  const handleSemesterSelect = async (boxId: string, semester: string) => {
    setBoxSelections((prev) => ({ ...prev, [boxId]: semester }));
    setUsedSemesters((prev) => [...prev, semester]);

    // 🔄 Parse semester (e.g., "Fall 25" → "Fall", "25")
    const [term, year] = semester.split(" ");
    const uid = user?.id;

    if (!uid || !term || !year) return;

    try {
      const response = await fetch(
        `http://localhost:1234/add-semester?uid=${uid}&term=${term}&year=${year}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();
      if (result.response_type === "failure") {
        console.warn("Failed to add semester:", result.error);
      } else {
        console.log("Semester added:", result.message);
      }
    } catch (err) {
      console.error("Network error while adding semester:", err);
    }
  };

  const handleSemesterDrop = async (e: React.DragEvent, semesterId: string) => {
    e.preventDefault();

    const searchCourseRaw = e.dataTransfer.getData("searchCourse");
    const courseId = e.dataTransfer.getData("courseId");

    // Case 1: Dragged from search results
    if (searchCourseRaw) {
      const searchCourse = JSON.parse(searchCourseRaw);
      const newCourse = {
        id: `course-${Date.now()}`,
        courseCode: searchCourse.courseCode,
        courseTitle: searchCourse.courseName,
        semesterId,
        isEditing: false,
        prereqMet: false,
      };

      addCourse(semesterId, newCourse);

      if (user?.id) {
        const met = await checkPrereqs(
          user.id,
          newCourse.courseCode,
          semesterId
        );
        setPrereqStatus(newCourse.id, met);
      }

      const [term, year] = semesterId.split(" ");
      const uid = user?.id;
      if (!uid || !term || !year) return;

      try {
        const response = await fetch(
          `http://localhost:1234/add-course?uid=${uid}&code=${encodeURIComponent(
            newCourse.courseCode
          )}&title=${encodeURIComponent(
            newCourse.courseTitle
          )}&term=${term}&year=${year}`,
          {
            method: "POST",
          }
        );
        const body = await response.json();
        const met = body.prereqsMet as boolean;

        console.log(`Added ${newCourse.courseCode}, prereqsMet=${met}`);
        setPrereqStatus(newCourse.id, met);
      } catch (err) {
        console.error("Network error while saving search-dragged course:", err);
      }

      if (user?.id) {
        for (const c of courses) {
          if (c.id === newCourse.id) continue;
          const nowMet = await checkPrereqs(
            user.id,
            c.courseCode,
            c.semesterId
          );
          setPrereqStatus(c.id, nowMet);
        }
      }
    }

    // Case 2: Dragged from another semester
    else if (courseId) {
      handleDrop(e, semesterId);
    }
  };

  const handleSaveCourse = async (
    id: string,
    courseCode: string,
    courseTitle: string
  ) => {
    setCourses((prev) =>
      prev.map((course) =>
        course.id === id
          ? { ...course, courseCode, courseTitle, isEditing: false }
          : course
      )
    );

    const course = courses.find((c) => c.id === id);
    if (!course || !user?.id) return;

    const [term, year] = course.semesterId.split(" ");
    const uid = user.id;

    try {
      const response = await fetch(
        `http://localhost:1234/add-course?uid=${uid}&code=${encodeURIComponent(
          courseCode
        )}&title=${encodeURIComponent(
          courseTitle
        )}&term=${term}&year=${year}&skipCheck=true`,
        { method: "POST" }
      );

      const result = await response.json();
      if (result.response_type === "failure") {
        console.warn("Failed to add course to Firestore:", result.error);
      }
    } catch (err) {
      console.error("Network error while saving course:", err);
    }
  };

  const handleAddRightSemester = (currSemNum: number) => {
    const index = boxIds.indexOf(currSemNum);
    if (index === -1) return boxIds; // invalid semester id
    const newID = Math.max(...boxIds) + 1;

    const newBoxIds = [...boxIds];
    newBoxIds.splice(index + 1, 0, newID);
    setBoxIds(newBoxIds);
    console.log("right");
  };

  const handleAddLeftSemester = (currSemNum: number) => {
    const index = boxIds.indexOf(currSemNum);
    if (index === -1) return boxIds; // invalid semester id
    const newID = Math.max(...boxIds) + 1;

    const newBoxIds = [...boxIds];
    newBoxIds.splice(index, 0, newID);
    setBoxIds(newBoxIds);
    console.log("left");
  };

  const handleDeleteSemester = (semToDelete: number) => {
    setBoxIds((prevBoxIds) => prevBoxIds.filter((id) => id !== semToDelete));
    console.log("delete");
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
              onRightClick={(e) => handleRightClick(e, boxId)}
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
                    prereqMet={course.prereqMet}
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
            <button
              className="add-button"
              onClick={() => handleAddRightSemester(boxIds.length)}
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
    </div>
  );
}
