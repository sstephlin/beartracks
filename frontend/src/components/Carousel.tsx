import { useEffect, useState, useRef } from "react";
import SemesterBox from "./SemesterBox";
import CourseDrag from "./CourseDrag";
import { CourseDragManager } from "../hooks/CourseDragManager";
import { CourseItem } from "../types";
import { useUser } from "@clerk/clerk-react";
import { checkPrereqs } from "../utils/prereqUtils";
import "../styles/Carousel.css";
import "../styles/SemesterBox.css";
import RightClickComponent from "./RightClick.tsx";

interface CarouselProps {
  viewCount: string;
  setViewCount: React.Dispatch<React.SetStateAction<string>>;
  draggedSearchCourse: any | null;
  expanded: boolean;
  setRefreshSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}

// defines all the possible semesters the user can select
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

// defines all of the constant variables
export default function Carousel({
  viewCount,
  setViewCount,
  expanded,
  setRefreshSidebar,
}: CarouselProps) {
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
  const [dropError, setDropError] = useState<{
    message: string;
    semesterId: string;
  } | null>(null);
  const [draggedCourse, setDraggedCourse] = useState<{
    courseCode: string;
    isFromSearch: boolean;
  } | null>(null);
  const [courseAvailabilityCache, setCourseAvailabilityCache] = useState<{
    [courseCode: string]: string[];
  }>({});
  const [capstoneCourseId, setCapstoneCourseId] = useState<string | null>(null);
  const [manualDisclaimerShown, setManualDisclaimerShown] = useState(false);

  const {
    handleDragStart,
    handleDragEnd,
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

    try {
      const query = new URLSearchParams({
        uid: user.id,
        term,
        year,
      });
      // this adds the new cpastone course to the api fetch
      if (checked) {
        query.append("courseCode", courseCode); 
      }

      await fetch(`http://localhost:3232/update-capstone?${query.toString()}`, {
        method: "POST",
      });

      setCourses((prev) =>
        prev.map((c) => ({
          ...c,
          isCapstone: checked && c.id === courseId,
        }))
      );

      // update which course is being capstoned
      const newCapstoneId = checked ? courseId : null;
      setCapstoneCourseId(newCapstoneId);
    } catch (err) {
      console.error("Failed to update capstone:", err);
    }
  };

  // all these useEffects relate to a section in the backend
  useEffect(() => {
    const fetchCapstones = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(
          `http://localhost:3232/check-capstones?uid=${user.id}`
        );
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
          const savedCapstone = newCourses.find((c) => c.isCapstone);
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

  // this gets all unused semesters
  const getAvailableSemesters = () =>
    allSemesters.filter((s) => !usedSemesters.includes(s));

  // this handles when a semester is selected from dropdown
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

  useEffect(() => {
    const fetchCourseAvailability = async () => {
      try {
        const response = await fetch(
          "http://localhost:3232/get-all-course-availability"
        );
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

  const checkCourseOfferedInSemester = async (
    courseCode: string,
    semester: string
  ): Promise<boolean> => {
    // first check the cache
    if (courseAvailabilityCache[courseCode]) {
      return courseAvailabilityCache[courseCode].includes(semester);
    }

    // if not in cache, fetch and update cache
    try {
      const response = await fetch(
        `http://localhost:3232/check-semester?courseCode=${encodeURIComponent(
          courseCode
        )}`
      );
      const data = await response.json();

      if (data.result === "success") {
        const offeredSemesters = data.offeredSemesters as string[];
        // this then updates the cache
        setCourseAvailabilityCache((prev) => ({
          ...prev,
          [courseCode]: offeredSemesters,
        }));
        return offeredSemesters.includes(semester);
      }
      return false;
    } catch (err) {
      console.error("Error checking semester:", err);
      return false;
    }
  };

  // handles all the dragging functionality regarding a course
  const handleCourseDragStart = (
    e: React.DragEvent,
    courseCode: string,
    isFromSearch: boolean
  ) => {
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

  const handleDragOverSemester = async (
    e: React.DragEvent,
    semesterId: string
  ) => {
    e.preventDefault();
    if (!user?.id || !draggedCourse) return;

    // checks if course already exists in target semester
    const courseAlreadyExists = courses.some(
      (course) =>
        course.courseCode === draggedCourse.courseCode &&
        course.semesterId === semesterId
    );

    if (courseAlreadyExists) {
      setDropError({
        message: "Course already exists in this semester",
        semesterId,
      });
      return;
    }
    
    // checks if the course is offered
    const isOffered = await checkCourseOfferedInSemester(
      draggedCourse.courseCode,
      semesterId
    );
    if (!isOffered) {
      setDropError({
        message: "Course not offered in this semester",
        semesterId,
      });
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
    const sourceSemesterId = e.dataTransfer.getData("semesterId");

    if (sourceSemesterId === semesterId) {
      return;
    }

    // checks if the course already exists in target semester
    const courseAlreadyExists = courses.some(
      (course) =>
        course.courseCode ===
          (searchCourseRaw
            ? JSON.parse(searchCourseRaw).courseCode
            : courseCode) && course.semesterId === semesterId
    );

    if (courseAlreadyExists) {
      setDropError({
        message: "Course already exists in this semester",
        semesterId,
      });
      setTimeout(() => setDropError(null), 3000);
      return;
    }

    if (searchCourseRaw) {
      const searchCourse = JSON.parse(searchCourseRaw);

      // checks if the course is offered in this semester
      const isOffered = await checkCourseOfferedInSemester(
        searchCourse.courseCode,
        semesterId
      );
      if (!isOffered) {
        setDropError({
          message: "Course not offered in this semester",
          semesterId,
        });
        setTimeout(() => setDropError(null), 3000);
        return;
      }

      // checks the prerequisites first
      const met = await checkPrereqs(
        user.id,
        searchCourse.courseCode,
        semesterId
      );

      const isEligible = capstoneCodes.has(searchCourse.courseCode);

      const newCourse: CourseItem = {
        id: `course-${Date.now()}`,
        courseCode: searchCourse.courseCode,
        title: searchCourse.courseName,
        semesterId,
        isEditing: false,
        prereqsMet: met,
        isCapstone: false,
        showCapstoneCheckbox: isEligible,
      };

      // gets the updated state using a promise
      const updatedCourses = await new Promise<CourseItem[]>((resolve) => {
        setCourses((prevCourses) => {
          const updated = [...prevCourses, newCourse];
          resolve(updated);
          return updated;
        });
      });

      // syncs with the backend for search results
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

        console.log("Added course from search to semester in backend");

        // checks if the added course affects any other courses in the same semester (for concurrent prereqs)
        for (const course of updatedCourses) {
          if (course.semesterId === semesterId && course.id !== newCourse.id) {
            const prereqsMet = await checkPrereqs(
              user.id,
              course.courseCode,
              course.semesterId
            );
            setPrereqStatus(course.id, prereqsMet);
            console.log(
              `Rechecked concurrent course ${course.courseCode} after adding ${newCourse.courseCode}: prereqsMet=${prereqsMet}`
            );
          }
        }

        // rechecks all prerequisites with the updated courses
        setTimeout(() => {
          recheckAllPrereqs(updatedCourses);
        }, 100);
      } catch (err) {
        console.error("Failed to sync course to backend:", err);
      }
    } else if (courseId || (courseCode && sourceSemesterId)) {
      // moves existing courses between semesters
      const course = courses.find(
        (c) =>
          c.id === courseId ||
          (c.courseCode === courseCode && c.semesterId === sourceSemesterId)
      );
      if (!course) return;

      // checks if course is offered in the target semester
      const isOffered = await checkCourseOfferedInSemester(
        course.courseCode,
        semesterId
      );
      if (!isOffered) {
        setDropError({
          message: "Course not offered in this semester",
          semesterId,
        });
        setTimeout(() => setDropError(null), 3000);
        return;
      }

      // gets the old semester info for deletion
      const [oldTerm, oldYear] = course.semesterId.split(" ");

      // updates the course's semester in state
      const updatedCourses = await new Promise<CourseItem[]>((resolve) => {
        setCourses((prevCourses) => {
          const updated = prevCourses.map((c) =>
            c.id === course.id ? { ...c, semesterId } : c
          );
          resolve(updated);
          return updated;
        });
      });

      // gets the new semester info
      const [newTerm, newYear] = semesterId.split(" ");

      try {
        // deletes the course from the old semester
        await fetch(
          `http://localhost:3232/remove-course?uid=${
            user.id
          }&code=${encodeURIComponent(
            course.courseCode
          )}&term=${oldTerm}&year=${oldYear}`,
          { method: "POST" }
        );

        console.log("Removed course from old semester in backend");

        // adds the course to the new semester
        await fetch(
          `http://localhost:3232/add-course?uid=${
            user.id
          }&code=${encodeURIComponent(
            course.courseCode
          )}&title=${encodeURIComponent(
            course.title
          )}&term=${newTerm}&year=${newYear}`,
          { method: "POST" }
        );

        console.log("Added course to new semester in backend");

        // checks prerequisites for the moved course
        const prereqsMet = await checkPrereqs(
          user.id,
          course.courseCode,
          semesterId
        );

        // updates the moved course's prereq status
        for (const c of updatedCourses) {
          if (c.id === course.id) {
            setPrereqStatus(c.id, prereqsMet);
            console.log(
              `Updated moved course ${c.courseCode} prereqsMet=${prereqsMet}`
            );
            break;
          }
        }

        // checks if this affects any other courses in the source semester (losing a concurrent prereq)
        for (const c of updatedCourses) {
          if (c.semesterId === sourceSemesterId && c.id !== course.id) {
            const coursePrereqsMet = await checkPrereqs(
              user.id,
              c.courseCode,
              c.semesterId
            );
            setPrereqStatus(c.id, coursePrereqsMet);
            console.log(
              `🔄 Rechecked course in source semester ${c.courseCode} after removal: prereqsMet=${coursePrereqsMet}`
            );
          }
        }

        // checks if this affects any other courses in the target semester (gaining a concurrent prereq)
        for (const c of updatedCourses) {
          if (c.semesterId === semesterId && c.id !== course.id) {
            const coursePrereqsMet = await checkPrereqs(
              user.id,
              c.courseCode,
              c.semesterId
            );
            setPrereqStatus(c.id, coursePrereqsMet);
            console.log(
              `Rechecked course in target semester ${c.courseCode} after addition: prereqsMet=${coursePrereqsMet}`
            );
          }
        }

        // checks again all prerequisites to ensure everything is consistent
        setTimeout(() => {
          recheckAllPrereqs(updatedCourses);
        }, 100);
      } catch (err) {
        console.error("Failed to sync course move to backend:", err);
      }
    }
    setRefreshSidebar((prev) => !prev);
  };

  const handleSaveCourse = async (
    id: string,
    courseCode: string,
    title: string
  ) => {
    // removes the course if both fields are empty
    if (!courseCode.trim() && !title.trim()) {
      setCourses((prev) => prev.filter((c) => c.id !== id));
      return;
    }

    // gets the updated state using a promise
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
      // syncs to the backend
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

      console.log("Saved course to backend:", courseCode);

      // checks again all prerequisites with the updated courses
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

      console.log("removeCourse event received:", courseCode, semesterId);
      if (!user?.id) return;

      setCourses((prev) => {
        const updated = prev.filter(
          (c) => !(c.courseCode === courseCode && c.semesterId === semesterId)
        );

        // checks all prerequisites after course removal but uses the updated courses array 
        // that no longer includes the deleted course
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
    // considers the case of an invalid semester id
    } else if (index === -1) return boxIds; 
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
    // considers the case of an invalid semester id
    if (index === -1) return boxIds; 
    const newID = (Math.max(...boxIds.map(Number)) + 1).toString();

    const newBoxIds = [...boxIds];
    newBoxIds.splice(index, 0, newID);
    setBoxIds(newBoxIds);
    console.log("newId", Math.max(...boxIds.map(Number)) + 1);
    console.log("newIds", newBoxIds);
  };

  const handleDeleteSemester = async (boxIdToDelete: string) => {
    const semester = boxSelections[boxIdToDelete];
    if (!semester || !user?.id) return;

    const [term, year] = semester.split(" ");

    try {
      const res = await fetch(
        `http://localhost:3232/remove-semester?uid=${user.id}&term=${term}&year=${year}`,
        {
          method: "POST",
        }
      );
      const data = await res.json();

      if (data.response_type === "success") {
        setBoxIds((prev) => prev.filter((id) => id !== boxIdToDelete));
        setUsedSemesters((prev) => prev.filter((s) => s !== semester));

        setBoxSelections((prev) => {
          const newSelections = { ...prev };
          delete newSelections[boxIdToDelete];
          return newSelections;
        });

        // removes all courses from that semester
        setCourses((prev) => prev.filter((c) => c.semesterId !== semester));
      } else {
        console.error("Delete failed:", data.error);
      }
    } catch (err) {
      console.error("Network error during delete:", err);
    }
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const handleScroll = (direction: "left" | "right") => {
    const container = document.querySelector(".carousel-inner-wrapper");
    if (!container) return;
    const scrollAmount = boxWidth;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };
  const boxRef = useRef<HTMLDivElement>(null);
  const [boxWidth, setBoxWidth] = useState<number>(270);

  useEffect(() => {
    if (boxRef.current) {
      setBoxWidth(boxRef.current.offsetWidth);
    }
    console.log("width", boxRef.current?.offsetWidth);
  }, [expanded, viewCount]);

  useEffect(() => {
    window.addEventListener(
      "searchCourseDragStart",
      handleSearchCourseDragStart as EventListener
    );
    return () => {
      window.removeEventListener(
        "searchCourseDragStart",
        handleSearchCourseDragStart as EventListener
      );
    };
  }, []);
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateScrollButtons = () => {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft + container.clientWidth < container.scrollWidth
      );
    };
    // handles viewport resize
    updateScrollButtons(); 
    container.addEventListener("scroll", updateScrollButtons);
    window.addEventListener("resize", updateScrollButtons); 

    return () => {
      container.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, []);
  useEffect(() => {
    const getView = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(
          `http://localhost:3232/get-view?uid=${user.id}`
        );
        const data = await res.json();
        if (data.view) {
          setViewCount(data.view);
        }
      } catch (err) {
        console.error("failed to fetch view-count", err);
      }
    };
    getView();
  }, [user?.id]);

  return (
    <div
      className={`carousel-outer-wrapper ${
        viewCount === "2" ? "two" : "four"
      } ${expanded ? "expanded" : "collapsed"}`}
    >
      {dropError && (
        <div className="drop-error-message">{dropError.message}</div>
      )}

      <button
        className="carousel-button left"
        onClick={() => handleScroll("left")}
        disabled={!canScrollLeft}
      >
        ‹
      </button>

      <div
        className={`carousel-inner-wrapper ${
          viewCount === "2" ? "two" : "four"
        } ${expanded ? "expanded" : "collapsed"}`}
        ref={scrollContainerRef}
      >
        <div className="carousel-track">
          {boxIds.map((boxId) => (
            <SemesterBox
              key={boxId}
              boxId={boxId}
              selectedSemester={boxSelections[boxId] || ""}
              availableSemesters={getAvailableSemesters()}
              onSemesterSelect={handleSemesterSelect}
              onDragOver={(e) =>
                boxSelections[boxId] &&
                handleDragOverSemester(e, boxSelections[boxId])
              }
              onDragLeave={handleDragLeave}
              onDrop={(e) =>
                boxSelections[boxId] &&
                handleSemesterDrop(e, boxSelections[boxId])
              }
              expanded={expanded}
              onRightClick={(e) => handleRightClick(e, boxId)}
              errorMessage={
                dropError && dropError.semesterId === boxSelections[boxId]
                  ? dropError.message
                  : null
              }
              ref={boxRef}
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
                    onDragStart={(e) =>
                      handleCourseDragStart(e, course.courseCode, false)
                    }
                    onDragEnd={handleCourseDragEnd}
                    onSaveCourse={handleSaveCourse}
                    isManual={course.isManual ?? false}
                    prereqsMet={course.prereqsMet ?? false}
                    isCapstone={course.isCapstone ?? false}
                    showCapstoneCheckbox={capstoneCodes.has(course.courseCode)}
                    onToggleCapstone={handleToggleCapstone}
                    aria-label={`Course ${course.courseCode}: ${course.title}`}
                  />
                ))}

              <button
                className="add-course-button"
                onClick={() => {
                  if (!manualDisclaimerShown) {
                    setShowManualAddDisclaimer(true);
                    setManualDisclaimerShown(true);
                  }
                  addCourse(boxSelections[boxId], undefined, "new", true);
                }}
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
        onClick={() => handleScroll("right")}
        disabled={!canScrollRight}
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
              You're manually adding a course. Enter course code and course name
              for Non-CS courses, and hit Enter to save this manually-added
              course. Please not that these courses will not be tracked on your
              concentration progression meter.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
