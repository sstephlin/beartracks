import { useEffect, useState, useRef } from "react";
import SemesterBox from "./SemesterBox";
import CourseDrag from "./CourseDrag";
import { CourseDragManager } from "../hooks/CourseDragManager";
import { CourseItem } from "../types";
import { useUser } from "@clerk/clerk-react";
import { checkPrereqs } from "../utils/prereqUtils";
import { sessionStorageUtils } from "../utils/sessionStorageUtils";
import { concentrationUtils } from "../utils/concentrationUtils";
import { loadPrerequisites } from "../utils/prerequisiteLoader";
import "../styles/Carousel.css";
import "../styles/SemesterBox.css";
import RightClickComponent from "./RightClick.tsx";
// import.meta.env.VITE_BACKEND_URL;

interface CarouselProps {
  viewCount: string;
  setViewCount: React.Dispatch<React.SetStateAction<string>>;
  draggedSearchCourse: any | null;
  expanded: boolean;
  setRefreshSidebar: React.Dispatch<React.SetStateAction<boolean>>;
}

// defines all the possible semesters the user can select
const allSemesters = [
  "Fall 2021",
  "Winter 2021",
  "Spring 2022",
  "Summer 2022",
  "Fall 2022",
  "Winter 2022",
  "Spring 2023",
  "Summer 2023",
  "Fall 2023",
  "Winter 2023",
  "Spring 2024",
  "Summer 2024",
  "Fall 2024",
  "Winter 2024",
  "Spring 2025",
  "Summer 2025",
  "Fall 2025",
  "Winter 2025",
  "Spring 2026",
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
  const [hasTransferredSessionData, setHasTransferredSessionData] = useState(false);
  const [manualCourseCodes, setManualCourseCodes] = useState<Set<string>>(new Set());

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
    if (!course) return;

    const { courseCode, semesterId } = course;
    const [term, year] = semesterId.split(" ");
    
    // Update state regardless of sign-in status
    setCourses((prev) =>
      prev.map((c) => ({
        ...c,
        isCapstone: checked && c.id === courseId,
      }))
    );

    // update which course is being capstoned
    const newCapstoneId = checked ? courseId : null;
    setCapstoneCourseId(newCapstoneId);
    
    if (!user?.id) {
      // Save to session storage if user is not signed in
      const sessionData = sessionStorageUtils.getSessionData() || { courses: [], semesters: boxSelections };
      sessionData.courses = courses.map((c) => ({
        ...c,
        isCapstone: checked && c.id === courseId,
      }));
      sessionData.capstoneId = newCapstoneId || undefined;
      sessionStorageUtils.saveSessionData(sessionData);
      return;
    }

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

      await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/update-capstone?${query.toString()}`,
        {
          method: "POST",
        }
      );

      // State already updated above
    } catch (err) {
      console.error("Failed to update capstone:", err);
    }
  };

  // NEW: Handle deletion of manual courses (frontend only)
  const handleDeleteManualCourse = (courseId: string) => {
    setCourses((prev) => {
      const updated = prev.filter((c) => c.id !== courseId);

      // Recheck prerequisites after removal for remaining courses
      setTimeout(() => {
        recheckAllPrereqs(updated);
      }, 100);

      return updated;
    });

    console.log("Deleted manual course (frontend only):", courseId);
    setRefreshSidebar((prev) => !prev);
  };

  // handling deleting semesters (backend courses)
  const handleDeleteCourse = async (
    courseId: string,
    courseCode: string,
    semesterId: string
  ) => {
    const [term, year] = semesterId.split(" ");

    // Handle local delete for non-signed-in users
    if (!user?.id) {
      setCourses((prev) => {
        const updated = prev.filter((c) => c.id !== courseId);

        // Persist to session storage
        const sessionData =
          sessionStorageUtils.getSessionData() || { courses: [], semesters: {} };
        sessionData.courses = updated;
        sessionStorageUtils.saveSessionData(sessionData);

        // Recheck prerequisites locally
        setTimeout(() => {
          recheckAllPrereqs(updated);
        }, 100);

        return updated;
      });

      setRefreshSidebar((prev) => !prev);
      return;
    }

    try {
      // Remove from backend
      await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/remove-course?uid=${
          user.id
        }&code=${encodeURIComponent(courseCode)}&term=${term}&year=${year}`,
        { method: "POST" }
      );

      // Remove from state
      setCourses((prev) => {
        const updated = prev.filter((c) => c.id !== courseId);

        // Recheck prerequisites after removal
        setTimeout(() => {
          recheckAllPrereqs(updated);
        }, 100);

        return updated;
      });

      console.log("Deleted course:", courseCode);
      setRefreshSidebar((prev) => !prev);
    } catch (err) {
      console.error("Failed to delete course:", err);
    }
  };

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    courseId: string;
    courseCode: string;
    courseTitle: string;
    semesterId: string;
  } | null>(null);

  const handleDeleteRequest = (
    courseId: string,
    courseCode: string,
    courseTitle: string,
    semesterId: string
  ) => {
    setDeleteConfirmation({
      courseId,
      courseCode,
      courseTitle,
      semesterId,
    });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmation) {
      handleDeleteCourse(
        deleteConfirmation.courseId,
        deleteConfirmation.courseCode,
        deleteConfirmation.semesterId
      );
      setDeleteConfirmation(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmation(null);
  };

  // all these useEffects relate to a section in the backend
  useEffect(() => {
    const fetchCapstones = async () => {
      if (!user?.id) {
        // For non-signed-in users, use local capstone data
        const sessionData = sessionStorageUtils.getSessionData();
        const concentration = sessionData?.concentration || "Computer Science Sc.B.";
        const requirements = concentrationUtils.getRequirements(concentration);
        const capstoneCourses = requirements.requirements_options["Capstone"] || [];
        setCapstoneCodes(new Set(capstoneCourses));
        return;
      }
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/check-capstones?uid=${user.id}`
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

  // Update capstone codes when concentration changes for non-signed-in users
  useEffect(() => {
    if (!user?.id) {
      const handleStorageChange = () => {
        const sessionData = sessionStorageUtils.getSessionData();
        const concentration = sessionData?.concentration || "Computer Science Sc.B.";
        const requirements = concentrationUtils.getRequirements(concentration);
        const capstoneCourses = requirements.requirements_options["Capstone"] || [];
        setCapstoneCodes(new Set(capstoneCourses));
      };

      // Listen for storage events (changes from other tabs/windows)
      window.addEventListener('storage', handleStorageChange);
      
      // Also check periodically for changes in the same tab
      const interval = setInterval(() => {
        handleStorageChange();
      }, 1000);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        clearInterval(interval);
      };
    }
  }, [user?.id]);

  // Load manual course codes from localStorage for signed-in users
  useEffect(() => {
    const storedManualCourses = localStorage.getItem('manualCourseCodes');
    if (storedManualCourses) {
      try {
        setManualCourseCodes(new Set(JSON.parse(storedManualCourses)));
      } catch (e) {
        console.error('Failed to parse manual course codes:', e);
      }
    }
  }, []);

  // Save manual course codes to localStorage whenever they change
  useEffect(() => {
    if (manualCourseCodes.size > 0) {
      localStorage.setItem('manualCourseCodes', JSON.stringify(Array.from(manualCourseCodes)));
    }
  }, [manualCourseCodes]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        // Load prerequisites CSV for non-signed-in users
        await loadPrerequisites();
        
        // Load from session storage if user is not signed in
        const sessionData = sessionStorageUtils.getSessionData();
        if (sessionData && sessionData.semesters && Object.keys(sessionData.semesters).length > 0) {
          const { courses: sessionCourses, semesters, capstoneId, manualCourses } = sessionData;
          
          // Restore box selections and IDs
          const newBoxIds = Object.keys(semesters);
          setBoxIds(newBoxIds);
          setBoxSelections(semesters);
          setUsedSemesters(Object.values(semesters));
          setCourses(sessionCourses || []);
          
          if (capstoneId) {
            setCapstoneCourseId(capstoneId);
          }
          
          if (manualCourses) {
            setManualCourseCodes(new Set(manualCourses));
          }
          
          // Trigger prerequisite checking for non-signed-in users after loading courses
          if (sessionCourses && sessionCourses.length > 0) {
            console.log("Triggering prereq check for session courses:", sessionCourses.length);
            setTimeout(() => {
              recheckAllPrereqs(sessionCourses);
            }, 100);
          }
        } else {
          // If no session data, create default 1 box for new users
          // This gives them 1 semester box + the add semester box
          setBoxIds(["1"]);
          setBoxSelections({});
          setUsedSemesters([]);
          setCourses([]);
        }
        return;
      }

      // Transfer session data to backend if user just signed in
      if (!hasTransferredSessionData) {
        const transferred = await sessionStorageUtils.transferSessionDataToBackend(
          user.id,
          import.meta.env.VITE_BACKEND_URL
        );
        if (transferred) {
          setHasTransferredSessionData(true);
        }
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/get-user-courses-detailed?uid=${
            user.id
          }`
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
            // Using 4-digit years consistently
            
            const boxId = `${boxCounter}`;
            newBoxIds.push(boxId);
            newBoxSelections[boxId] = semester;
            newUsedSemesters.push(semester);

            for (const course of courseList) {
              // Check if this course is in our manual courses set
              const isManualCourse = manualCourseCodes.has(course.courseCode);
              
              newCourses.push({
                id: `course-${Date.now()}-${Math.random()}`,
                courseCode: course.courseCode,
                title: course.title,
                semesterId: semester,
                isEditing: false,
                prereqsMet: isManualCourse ? undefined : (course.prereqsMet ?? undefined),
                isCapstone: course.isCapstone ?? false,
                isManual: isManualCourse,
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
          
          // Recheck prerequisites after loading courses
          setTimeout(() => {
            recheckAllPrereqs(newCourses);
          }, 100);
        } else {
          console.error("Backend error:", data.error);
        }
      } catch (err) {
        console.error("Fetch failed:", err);
      }
    };

    fetchData();
  }, [user?.id, hasTransferredSessionData]);

  // this gets all unused semesters
  const getAvailableSemesters = () =>
    allSemesters.filter((s) => !usedSemesters.includes(s));

  // this handles when a semester is selected from dropdown
  const handleSemesterSelect = async (boxId: string, semester: string) => {
    setBoxSelections((prev) => ({ ...prev, [boxId]: semester }));
    setUsedSemesters((prev) => [...prev, semester]);
    setSelectedSemester(semester);

    const [term, year] = semester.split(" ");
    
    if (!user?.id) {
      // Save to session storage if user is not signed in
      const sessionData = sessionStorageUtils.getSessionData() || { courses: [], semesters: {} };
      sessionData.semesters[boxId] = semester;
      sessionStorageUtils.saveSessionData(sessionData);
      return;
    }
    
    if (!term || !year) return;

    try {
      await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/add-semester?uid=${
          user.id
        }&term=${term}&year=${year}`,
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
          `${import.meta.env.VITE_BACKEND_URL}/get-all-course-availability`
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

  // No longer need year conversion - using 4-digit years everywhere

  // Helper to convert just the year part
  // No longer needed - using 4-digit years everywhere
  // const yearTo2Digit = (year: string): string => {
  //   return year.length === 4 ? year.slice(-2) : year;
  // };

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
        `${
          import.meta.env.VITE_BACKEND_URL
        }/check-semester?courseCode=${encodeURIComponent(courseCode)}`
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
    if (!draggedCourse) return;

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

      // checks the prerequisites first (works for signed-in and unsigned users)
      const met = await checkPrereqs(
        user?.id ?? "",
        searchCourse.courseCode,
        semesterId
      );
      console.log(`Prereq check for ${searchCourse.courseCode}: ${met}`);

      const isEligible = capstoneCodes.has(searchCourse.courseCode);

      const newCourse: CourseItem = {
        id: `course-${Date.now()}`,
        courseCode: searchCourse.courseCode,
        title: searchCourse.courseName,
        semesterId,
        isEditing: false,
        prereqsMet: met ?? undefined,
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

      // Save to session storage if user is not signed in
      if (!user?.id) {
        const sessionData = sessionStorageUtils.getSessionData() || { courses: [], semesters: {} };
        sessionData.courses = updatedCourses;
        sessionStorageUtils.saveSessionData(sessionData);

        // Re-check any courses in this same semester that might depend on the
        // newly added concurrent prerequisite
        for (const course of updatedCourses) {
          if (course.semesterId === semesterId && course.id !== newCourse.id && !course.isManual) {
            const prereqsMet = await checkPrereqs(
              user?.id ?? "",
              course.courseCode,
              course.semesterId
            );
            setPrereqStatus(course.id, prereqsMet);
          }
        }

        // Global recheck to keep everything consistent
        setTimeout(() => {
          recheckAllPrereqs(updatedCourses);
        }, 100);
      } else {
        // syncs with the backend for search results
        const [term, year] = semesterId.split(" ");
            try {
          await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/add-course?uid=${
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
            if (course.semesterId === semesterId && course.id !== newCourse.id && !course.isManual) {
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

      if (!user?.id) {
        // Save to session storage if user is not signed in
        const sessionData = sessionStorageUtils.getSessionData() || { courses: [], semesters: {} };
        sessionData.courses = updatedCourses;
        sessionStorageUtils.saveSessionData(sessionData);

        // Check prerequisites for the moved course (local CSV flow)
        if (!course.isManual) {
          const movedPrereqsMet = await checkPrereqs(
            "",
            course.courseCode,
            semesterId
          );
          setPrereqStatus(course.id, movedPrereqsMet);
        }

        // Re-evaluate courses impacted in the source semester (lost concurrent prereq)
        for (const c of updatedCourses) {
          if (c.semesterId === sourceSemesterId && c.id !== course.id && !c.isManual) {
            const coursePrereqsMet = await checkPrereqs(
              "",
              c.courseCode,
              c.semesterId
            );
            setPrereqStatus(c.id, coursePrereqsMet);
          }
        }

        // Re-evaluate courses impacted in the target semester (gained concurrent prereq)
        for (const c of updatedCourses) {
          if (c.semesterId === semesterId && c.id !== course.id && !c.isManual) {
            const coursePrereqsMet = await checkPrereqs(
              "",
              c.courseCode,
              c.semesterId
            );
            setPrereqStatus(c.id, coursePrereqsMet);
          }
        }

        // Final pass to keep everything consistent
        setTimeout(() => {
          recheckAllPrereqs(updatedCourses);
        }, 100);
      } else {
        try {
          // deletes the course from the old semester
          await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/remove-course?uid=${
              user.id
            }&code=${encodeURIComponent(
              course.courseCode
            )}&term=${oldTerm}&year=${oldYear}`,
            { method: "POST" }
          );

          console.log("Removed course from old semester in backend");

          // adds the course to the new semester
          await fetch(
            `${import.meta.env.VITE_BACKEND_URL}/add-course?uid=${
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
            if (c.semesterId === sourceSemesterId && c.id !== course.id && !c.isManual) {
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
            if (c.semesterId === semesterId && c.id !== course.id && !c.isManual) {
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

    // Track this as a manual course
    setManualCourseCodes((prev) => new Set([...prev, courseCode]));

    // gets the updated state using a promise
    const updatedCourses = await new Promise<CourseItem[]>((resolve) => {
      setCourses((prev) => {
        const updated = prev.map((c) =>
          c.id === id ? { ...c, courseCode, title, isEditing: false, isManual: true } : c
        );
        resolve(updated);
        return updated;
      });
    });

    const course = updatedCourses.find((c) => c.id === id);
    if (!course) return;

    if (!user?.id) {
      // Save to session storage if user is not signed in
      const sessionData = sessionStorageUtils.getSessionData() || { courses: [], semesters: boxSelections };
      sessionData.courses = updatedCourses;
      sessionData.manualCourses = Array.from(manualCourseCodes);
      sessionStorageUtils.saveSessionData(sessionData);
      return;
    }

    const [term, year] = course.semesterId.split(" ");

    try {
      // syncs to the backend
      await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/add-course?uid=${
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

      setCourses((prev) => {
        const updated = prev.filter(
          (c) => !(c.courseCode === courseCode && c.semesterId === semesterId)
        );

        // Save to session storage if user is not signed in
        if (!user?.id) {
          const sessionData = sessionStorageUtils.getSessionData() || { courses: [], semesters: boxSelections };
          sessionData.courses = updated;
          sessionStorageUtils.saveSessionData(sessionData);
        } else {
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
        }

        return updated;
      });
    };

    window.addEventListener("removeCourse", handleRemoveCourse);
    return () => window.removeEventListener("removeCourse", handleRemoveCourse);
  }, [user?.id, setPrereqStatus, recheckAllPrereqs, boxSelections]);

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
    if (!semester) return;

    // Update state for both signed-in and non-signed-in users
    setBoxIds((prev) => prev.filter((id) => id !== boxIdToDelete));
    setUsedSemesters((prev) => prev.filter((s) => s !== semester));
    
    const newBoxSelections = { ...boxSelections };
    delete newBoxSelections[boxIdToDelete];
    setBoxSelections(newBoxSelections);
    
    // removes all courses from that semester
    const updatedCourses = courses.filter((c) => c.semesterId !== semester);
    setCourses(updatedCourses);
    
    if (!user?.id) {
      // Save to session storage if user is not signed in
      const sessionData = sessionStorageUtils.getSessionData() || { courses: [], semesters: {} };
      sessionData.courses = updatedCourses;
      sessionData.semesters = newBoxSelections;
      sessionStorageUtils.saveSessionData(sessionData);
      return;
    }

    const [term, year] = semester.split(" ");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/remove-semester?uid=${
          user.id
        }&term=${term}&year=${year}`,
        {
          method: "POST",
        }
      );
      const data = await res.json();

      if (data.response_type !== "success") {
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
      if (!user?.id) {
        // Load from session storage for unsigned users
        const sessionData = sessionStorageUtils.getSessionData();
        if (sessionData?.viewCount) {
          setViewCount(sessionData.viewCount);
        }
        return;
      }
      
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/get-view?uid=${user.id}`
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
                    onDeleteCourse={handleDeleteRequest}
                    onDeleteManualCourse={handleDeleteManualCourse} // NEW: Pass the manual delete handler
                    userId={user?.id}
                    isManual={course.isManual ?? false}
                    prereqsMet={course.prereqsMet}
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
                + New Course
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
              course. Please note that these courses will not be tracked on your
              concentration progression meter.
            </p>
          </div>
        </div>
      )}

      {deleteConfirmation && (
        <div
          className="confirmation-overlay"
          onClick={(e) => {
            if (
              (e.target as HTMLElement).classList.contains(
                "confirmation-overlay"
              )
            ) {
              handleCancelDelete();
            }
          }}
        >
          <div className="confirmation-box">
            <h2>Delete Course</h2>
            <p>
              Are you sure you want to delete{" "}
              <strong>{deleteConfirmation.courseTitle}</strong> (
              {deleteConfirmation.courseCode})?
            </p>
            <div className="confirmation-buttons">
              <button
                className="confirm-delete-btn"
                onClick={handleConfirmDelete}
              >
                Yes, Delete
              </button>
              <button
                className="cancel-delete-btn"
                onClick={handleCancelDelete}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
