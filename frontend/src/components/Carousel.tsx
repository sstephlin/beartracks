// // import { useState, useEffect } from "react";
// // import SemesterBox from "./SemesterBox";
// // import CourseDrag from "./CourseDrag";
// // import { CarouselMover } from "../hooks/CarouselMover.ts";
// // import { CourseDragManager } from "../hooks/CourseDragManager.ts";
// // import "../styles/Carousel.css";
// // import "../styles/SemesterBox.css";
// // import { useUser } from "@clerk/clerk-react";
// // import { checkPrereqs } from "../utils/prereqUtils";
// // import { CourseItem } from "../types";

// // interface CarouselProps {
// //   viewCount: number;
// //   setViewCount: React.Dispatch<React.SetStateAction<number>>;
// //   draggedSearchCourse: any | null;
// //   expanded: boolean;
// //   uid: string | undefined;
// // }

// // const allSemesters = [
// //   "Fall 21",
// //   "Winter 21",
// //   "Spring 22",
// //   "Summer 22",
// //   "Fall 22",
// //   "Winter 22",
// //   "Spring 23",
// //   "Summer 23",
// //   "Fall 23",
// //   "Winter 23",
// //   "Spring 24",
// //   "Summer 24",
// //   "Fall 24",
// //   "Winter 24",
// //   "Spring 25",
// //   "Summer 25",
// //   "Fall 25",
// //   "Winter 25",
// //   "Spring 26",
// // ];

// // export default function Carousel({
// //   viewCount,
// //   setViewCount,
// //   draggedSearchCourse,
// //   expanded,
// // }: CarouselProps) {
// //   const [boxIds, setBoxIds] = useState<string[]>([]); // ✅ CHANGED: now defaults from localStorage
// //   const [usedSemesters, setUsedSemesters] = useState<string[]>([]); // ✅ CHANGED: now defaults from localStorage
// //   const [boxSelections, setBoxSelections] = useState<{
// //     [boxId: string]: string;
// //   }>({});
// //   const [selectedSemester, setSelectedSemester] = useState<string | null>(null);

// //   const { currentIndex, next, prev, maxIndex } = CarouselMover(
// //     allSemesters.length,
// //     viewCount
// //   );
// //   const { user } = useUser();

// //   const {
// //     courses,
// //     emptySlots,
// //     handleDragStart,
// //     handleDragEnd,
// //     handleDragOver,
// //     handleDrop,
// //     getCoursesForSemester,
// //     addCourse,
// //     setCourses,
// //     setPrereqStatus,
// //   } = CourseDragManager(user?.id ?? "", {
// //     setSelectedSemester,
// //     setUsedSemesters,
// //   });

// //   useEffect(() => {
// //     const savedBoxIds = localStorage.getItem("boxIds");
// //     const savedUsedSemesters = localStorage.getItem("usedSemesters");
// //     const savedBoxSelections = localStorage.getItem("boxSelections");
// //     const savedSelected = localStorage.getItem("selectedSemester");

// //     if (savedBoxIds) setBoxIds(JSON.parse(savedBoxIds));
// //     else setBoxIds(["box1", "box2"]);

// //     if (savedUsedSemesters) setUsedSemesters(JSON.parse(savedUsedSemesters));
// //     if (savedBoxSelections) setBoxSelections(JSON.parse(savedBoxSelections));
// //     if (savedSelected) setSelectedSemester(savedSelected);
// //   }, []);

// //   useEffect(() => {
// //     localStorage.setItem("boxIds", JSON.stringify(boxIds));
// //   }, [boxIds]);

// //   useEffect(() => {
// //     localStorage.setItem("usedSemesters", JSON.stringify(usedSemesters));
// //   }, [usedSemesters]);

// //   useEffect(() => {
// //     localStorage.setItem("boxSelections", JSON.stringify(boxSelections));
// //   }, [boxSelections]);

// //   useEffect(() => {
// //     if (selectedSemester) {
// //       localStorage.setItem("selectedSemester", selectedSemester);
// //     }
// //   }, [selectedSemester]);

// //   useEffect(() => {
// //     const handleRemoveCourse = async (e: any) => {
// //       const { courseCode, semesterId } = e.detail;
// //       console.log("Removing", courseCode, "from", semesterId);

// //       if (!user?.id) return;

// //       // 1) Remove locally and get the updated list
// //       setCourses((prev) => {
// //         const updated = prev.filter(
// //           (c) => !(c.courseCode === courseCode && c.semesterId === semesterId)
// //         );

// //         // 2) Re-check prereqs on the new list
// //         updated.forEach(async (c) => {
// //           const met = await checkPrereqs(user.id, c.courseCode, c.semesterId);
// //           setPrereqStatus(c.id, met);
// //         });

// //         return updated;
// //       });
// //     };

// //     window.addEventListener("removeCourse", handleRemoveCourse);
// //     return () => {
// //       window.removeEventListener("removeCourse", handleRemoveCourse);
// //     };
// //   }, [user?.id, setPrereqStatus, setCourses]);

// //   const getAvailableSemesters = () =>
// //     allSemesters.filter((sem) => !usedSemesters.includes(sem));

// //   const handleSemesterSelect = async (boxId: string, semester: string) => {
// //     setBoxSelections((prev) => ({ ...prev, [boxId]: semester }));
// //     setUsedSemesters((prev) => [...prev, semester]);
// //     setSelectedSemester(semester);
// //     localStorage.setItem("selectedSemester", semester);

// //     // 🔄 Parse semester (e.g., "Fall 25" → "Fall", "25")
// //     const [term, year] = semester.split(" ");
// //     const uid = user?.id;

// //     if (!uid || !term || !year) return;

// //     try {
// //       const response = await fetch(
// //         `http://localhost:3232/add-semester?uid=${uid}&term=${term}&year=${year}`,
// //         {
// //           method: "POST",
// //         }
// //       );

// //       const result = await response.json();
// //       if (result.response_type === "failure") {
// //         console.warn("Failed to add semester:", result.error);
// //       } else {
// //         console.log("Semester added:", result.message);
// //       }
// //     } catch (err) {
// //       console.error("Network error while adding semester:", err);
// //     }
// //   };

// //   const handleSemesterDrop = async (e: React.DragEvent, semesterId: string) => {
// //     e.preventDefault();

// //     const searchCourseRaw = e.dataTransfer.getData("searchCourse");
// //     const courseId = e.dataTransfer.getData("courseId");

// //     // Case 1: Dragged from search results
// //     if (searchCourseRaw) {
// //       const searchCourse = JSON.parse(searchCourseRaw);
// //       const newCourse = {
// //         id: `course-${Date.now()}`,
// //         courseCode: searchCourse.courseCode,
// //         courseTitle: searchCourse.courseName,
// //         semesterId,
// //         isEditing: false,
// //         prereqMet: false,
// //       };

// //       addCourse(semesterId, newCourse);

// //       if (user?.id) {
// //         const met = await checkPrereqs(
// //           user.id,
// //           newCourse.courseCode,
// //           semesterId
// //         );
// //         setPrereqStatus(newCourse.id, met);
// //       }

// //       // 🔁 Backend fetch to persist (NO skipCheck)
// //       const [term, year] = semesterId.split(" ");
// //       const uid = user?.id;
// //       if (!uid || !term || !year) return;

// //       try {
// //         const response = await fetch(
// //           `http://localhost:3232/add-course?uid=${uid}&code=${encodeURIComponent(
// //             newCourse.courseCode
// //           )}&title=${encodeURIComponent(
// //             newCourse.courseTitle
// //           )}&term=${term}&year=${year}`,
// //           {
// //             method: "POST",
// //           }
// //         );
// //         const body = await response.json();
// //         const met = body.prereqsMet as boolean;

// //         console.log(`Added ${newCourse.courseCode}, prereqsMet=${met}`);
// //         setPrereqStatus(newCourse.id, met);
// //       } catch (err) {
// //         console.error("Network error while saving search-dragged course:", err);
// //       }

// //       if (user?.id) {
// //         for (const c of courses) {
// //           if (c.id === newCourse.id) continue;
// //           const nowMet = await checkPrereqs(
// //             user.id,
// //             c.courseCode,
// //             c.semesterId
// //           );
// //           setPrereqStatus(c.id, nowMet);
// //         }
// //       }
// //     }

// //     // Case 2: Dragged from another semester
// //     else if (courseId) {
// //       handleDrop(e, semesterId);
// //     }
// //   };

// //   const handleSaveCourse = async (
// //     id: string,
// //     courseCode: string,
// //     courseTitle: string
// //   ) => {
// //     setCourses((prev) =>
// //       prev.map((course) =>
// //         course.id === id
// //           ? { ...course, courseCode, courseTitle, isEditing: false }
// //           : course
// //       )
// //     );

// //     const course = courses.find((c) => c.id === id);
// //     if (!course || !user?.id) return;

// //     const [term, year] = course.semesterId.split(" ");
// //     const uid = user.id;

// //     try {
// //       const response = await fetch(
// //         `http://localhost:3232/add-course?uid=${uid}&code=${encodeURIComponent(
// //           courseCode
// //         )}&title=${encodeURIComponent(
// //           courseTitle
// //         )}&term=${term}&year=${year}&skipCheck=true`,
// //         { method: "POST" }
// //       );

// //       const result = await response.json();
// //       if (result.response_type === "failure") {
// //         console.warn("Failed to add course to Firestore:", result.error);
// //       }
// //     } catch (err) {
// //       console.error("Network error while saving course:", err);
// //     }
// //   };

// //   const handleAddSemester = () => {
// //     const newBoxId = `box${boxIds.length + 1}`;
// //     setBoxIds((prevBoxIds) => [...prevBoxIds, newBoxId]);
// //   };

// //   const boxWidth = expanded ? 270 : 320;

// //   return (
// //     <div className="carousel-outer-wrapper">
// //       <button
// //         className="carousel-button left"
// //         onClick={prev}
// //         disabled={currentIndex === 0}
// //       >
// //         ‹
// //       </button>

// //       <div className="carousel-inner-wrapper">
// //         <div
// //           className="carousel-track"
// //           style={{
// //             transform: `translateX(-${currentIndex * boxWidth}px)`,
// //             transition: "transform 0.5s ease",
// //           }}
// //         >
// //           {boxIds.map((boxId) => (
// //             <SemesterBox
// //               key={boxId}
// //               boxId={boxId}
// //               selectedSemester={boxSelections[boxId] || ""}
// //               availableSemesters={getAvailableSemesters()}
// //               onSemesterSelect={handleSemesterSelect}
// //               onDragOver={handleDragOver}
// //               onDrop={(e) => {
// //                 const selected = boxSelections[boxId];
// //                 if (selected) handleSemesterDrop(e, selected);
// //               }}
// //               expanded={expanded}
// //             >
// //               {(boxSelections[boxId] &&
// //                 getCoursesForSemester(boxSelections[boxId]).map((course) => (
// //                   <CourseDrag
// //                     key={course.id}
// //                     id={course.id}
// //                     courseCode={course.courseCode}
// //                     courseTitle={course.courseTitle}
// //                     semesterId={boxSelections[boxId]}
// //                     isEmpty={false}
// //                     isEditing={course.isEditing}
// //                     onDragStart={handleDragStart}
// //                     onDragEnd={handleDragEnd}
// //                     onSaveCourse={handleSaveCourse}
// //                     prereqMet={course.prereqMet}
// //                   />
// //                 ))) ||
// //                 null}

// //               {boxSelections[boxId] &&
// //                 Array(emptySlots[boxSelections[boxId]] || 0)
// //                   .fill(0)
// //                   .map((_, i) => (
// //                     <CourseDrag
// //                       key={`empty-${boxId}-${i}`}
// //                       id={`empty-${boxId}-${i}`}
// //                       courseCode=""
// //                       courseTitle=""
// //                       semesterId={boxSelections[boxId]}
// //                       isEmpty={true}
// //                       onDragOver={handleDragOver}
// //                       onDrop={(e) =>
// //                         handleSemesterDrop(e, boxSelections[boxId])
// //                       }
// //                     />
// //                   ))}

// //               {boxSelections[boxId] && (
// //                 <button
// //                   className="add-course-button"
// //                   onClick={() =>
// //                     addCourse(boxSelections[boxId], undefined, "new")
// //                   }
// //                 >
// //                   + New course
// //                 </button>
// //               )}
// //             </SemesterBox>
// //           ))}

// //           <div className={`add-box ${expanded ? "expanded" : "collapsed"}`}>
// //             <button className="add-button" onClick={handleAddSemester}>
// //               <div className="add-button-plus">+</div>
// //               <div>New Semester</div>
// //             </button>
// //           </div>
// //         </div>
// //       </div>

// //       <button
// //         className="carousel-button right"
// //         onClick={next}
// //         disabled={currentIndex === maxIndex}
// //       >
// //         ›
// //       </button>
// //     </div>
// //   );
// // }

// import { useState, useEffect } from "react";
// import SemesterBox from "./SemesterBox";
// import CourseDrag from "./CourseDrag";
// import { CarouselMover } from "../hooks/CarouselMover.ts";
// import { CourseDragManager } from "../hooks/CourseDragManager.ts";
// import "../styles/Carousel.css";
// import "../styles/SemesterBox.css";
// import { useUser } from "@clerk/clerk-react";
// import { checkPrereqs } from "../utils/prereqUtils";
// import { CourseItem } from "../types";

// interface CarouselProps {
//   viewCount: number;
//   setViewCount: React.Dispatch<React.SetStateAction<number>>;
//   draggedSearchCourse: any | null;
//   expanded: boolean;
//   uid: string | undefined;
// }

// const allSemesters = [
//   "Fall 21",
//   "Winter 21",
//   "Spring 22",
//   "Summer 22",
//   "Fall 22",
//   "Winter 22",
//   "Spring 23",
//   "Summer 23",
//   "Fall 23",
//   "Winter 23",
//   "Spring 24",
//   "Summer 24",
//   "Fall 24",
//   "Winter 24",
//   "Spring 25",
//   "Summer 25",
//   "Fall 25",
//   "Winter 25",
//   "Spring 26",
// ];

// export default function Carousel({
//   viewCount,
//   setViewCount,
//   draggedSearchCourse,
//   expanded,
// }: CarouselProps) {
//   const [boxIds, setBoxIds] = useState<string[]>([]);
//   const [usedSemesters, setUsedSemesters] = useState<string[]>([]);
//   const [boxSelections, setBoxSelections] = useState<{
//     [boxId: string]: string;
//   }>({});
//   const [selectedSemester, setSelectedSemester] = useState<string | null>(null);

//   const { currentIndex, next, prev, maxIndex } = CarouselMover(
//     allSemesters.length,
//     viewCount
//   );
//   const { user } = useUser();

//   const {
//     courses,
//     emptySlots,
//     handleDragStart,
//     handleDragEnd,
//     handleDragOver,
//     handleDrop,
//     getCoursesForSemester,
//     addCourse,
//     setCourses,
//     setPrereqStatus,
//   } = CourseDragManager(user?.id ?? "", {
//     setSelectedSemester,
//     setUsedSemesters,
//   });

//   useEffect(() => {
//     const savedBoxIds = localStorage.getItem("boxIds");
//     const savedUsedSemesters = localStorage.getItem("usedSemesters");
//     const savedBoxSelections = localStorage.getItem("boxSelections");
//     const savedSelected = localStorage.getItem("selectedSemester");
//     const savedCourses = localStorage.getItem("courses");

//     if (savedBoxIds) {
//       setBoxIds(JSON.parse(savedBoxIds));
//     } else {
//       // Default: 2 boxes if none saved
//       setBoxIds(["box1", "box2"]);
//     }

//     if (savedUsedSemesters) setUsedSemesters(JSON.parse(savedUsedSemesters));
//     if (savedBoxSelections) setBoxSelections(JSON.parse(savedBoxSelections));
//     if (savedSelected) setSelectedSemester(savedSelected);

//     // If we have saved courses, load them into CourseDragManager
//     if (savedCourses) {
//       setCourses(JSON.parse(savedCourses));
//     }
//   }, [setCourses]);

//   // ----------------------------
//   // 2) Save to localStorage whenever these states change
//   // ----------------------------
//   useEffect(() => {
//     localStorage.setItem("boxIds", JSON.stringify(boxIds));
//   }, [boxIds]);

//   useEffect(() => {
//     localStorage.setItem("usedSemesters", JSON.stringify(usedSemesters));
//   }, [usedSemesters]);

//   useEffect(() => {
//     localStorage.setItem("boxSelections", JSON.stringify(boxSelections));
//   }, [boxSelections]);

//   useEffect(() => {
//     if (selectedSemester) {
//       localStorage.setItem("selectedSemester", selectedSemester);
//     }
//   }, [selectedSemester]);

//   useEffect(() => {
//     localStorage.setItem("courses", JSON.stringify(courses));
//   }, [courses]);

//   useEffect(() => {
//     const handleRemoveCourse = async (e: any) => {
//       const { courseCode, semesterId } = e.detail;
//       console.log("Removing", courseCode, "from", semesterId);

//       if (!user?.id) return;

//       // 1) Remove locally and get updated list
//       setCourses((prev) => {
//         const updated = prev.filter(
//           (c) => !(c.courseCode === courseCode && c.semesterId === semesterId)
//         );

//         // 2) Re-check prereqs on the new list
//         updated.forEach(async (c) => {
//           const met = await checkPrereqs(user.id, c.courseCode, c.semesterId);
//           setPrereqStatus(c.id, met);
//         });

//         return updated;
//       });
//     };

//     window.addEventListener("removeCourse", handleRemoveCourse);
//     return () => {
//       window.removeEventListener("removeCourse", handleRemoveCourse);
//     };
//   }, [user?.id, setPrereqStatus, setCourses]);

//   // ----------------------------
//   // 4) Semester selection
//   // ----------------------------
//   const getAvailableSemesters = () =>
//     allSemesters.filter((sem) => !usedSemesters.includes(sem));

//   const handleSemesterSelect = async (boxId: string, semester: string) => {
//     setBoxSelections((prev) => ({ ...prev, [boxId]: semester }));
//     setUsedSemesters((prev) => [...prev, semester]);
//     setSelectedSemester(semester);
//     localStorage.setItem("selectedSemester", semester);

//     // (Optional) Persist to backend
//     const [term, year] = semester.split(" ");
//     const uid = user?.id;
//     if (!uid || !term || !year) return;

//     try {
//       const response = await fetch(
//         `http://localhost:3232/add-semester?uid=${uid}&term=${term}&year=${year}`,
//         { method: "POST" }
//       );
//       const result = await response.json();
//       if (result.response_type === "failure") {
//         console.warn("Failed to add semester:", result.error);
//       } else {
//         console.log("Semester added:", result.message);
//       }
//     } catch (err) {
//       console.error("Network error while adding semester:", err);
//     }
//   };

//   // ----------------------------
//   // 5) Handling course drop
//   // ----------------------------
//   const handleSemesterDrop = async (e: React.DragEvent, semesterId: string) => {
//     e.preventDefault();

//     const searchCourseRaw = e.dataTransfer.getData("searchCourse");
//     const courseId = e.dataTransfer.getData("courseId");

//     // Case 1: Dragged from search results
//     if (searchCourseRaw) {
//       const searchCourse = JSON.parse(searchCourseRaw);
//       const newCourse: CourseItem = {
//         id: `course-${Date.now()}`,
//         courseCode: searchCourse.courseCode,
//         courseTitle: searchCourse.courseName,
//         semesterId,
//         isEditing: false,
//         prereqMet: false,
//       };

//       addCourse(semesterId, newCourse);

//       if (user?.id) {
//         const met = await checkPrereqs(
//           user.id,
//           newCourse.courseCode,
//           semesterId
//         );
//         setPrereqStatus(newCourse.id, met);
//       }

//       // (Optional) Persist to backend
//       const [term, year] = semesterId.split(" ");
//       const uid = user?.id;
//       if (!uid || !term || !year) return;

//       try {
//         const response = await fetch(
//           `http://localhost:3232/add-course?uid=${uid}&code=${encodeURIComponent(
//             newCourse.courseCode
//           )}&title=${encodeURIComponent(
//             newCourse.courseTitle
//           )}&term=${term}&year=${year}`,
//           { method: "POST" }
//         );
//         const body = await response.json();
//         const met = body.prereqsMet as boolean;

//         console.log(`Added ${newCourse.courseCode}, prereqsMet=${met}`);
//         setPrereqStatus(newCourse.id, met);
//       } catch (err) {
//         console.error("Network error while saving search-dragged course:", err);
//       }

//       // Re-check other courses if needed
//       if (user?.id) {
//         for (const c of courses) {
//           if (c.id === newCourse.id) continue;
//           const nowMet = await checkPrereqs(
//             user.id,
//             c.courseCode,
//             c.semesterId
//           );
//           setPrereqStatus(c.id, nowMet);
//         }
//       }
//     }

//     // Case 2: Dragged from another semester
//     else if (courseId) {
//       handleDrop(e, semesterId);
//     }
//   };

//   // ----------------------------
//   // 6) Editing a course in place
//   // ----------------------------
//   const handleSaveCourse = async (
//     id: string,
//     courseCode: string,
//     courseTitle: string
//   ) => {
//     setCourses((prev) =>
//       prev.map((course) =>
//         course.id === id
//           ? { ...course, courseCode, courseTitle, isEditing: false }
//           : course
//       )
//     );

//     const course = courses.find((c) => c.id === id);
//     if (!course || !user?.id) return;

//     const [term, year] = course.semesterId.split(" ");
//     const uid = user.id;

//     // (Optional) Persist to backend
//     try {
//       const response = await fetch(
//         `http://localhost:3232/add-course?uid=${uid}&code=${encodeURIComponent(
//           courseCode
//         )}&title=${encodeURIComponent(
//           courseTitle
//         )}&term=${term}&year=${year}&skipCheck=true`,
//         { method: "POST" }
//       );
//       const result = await response.json();
//       if (result.response_type === "failure") {
//         console.warn("Failed to add course to Firestore:", result.error);
//       }
//     } catch (err) {
//       console.error("Network error while saving course:", err);
//     }
//   };

//   // ----------------------------
//   // 7) Adding more boxes (semesters) to the carousel
//   // ----------------------------
//   const handleAddSemester = () => {
//     const newBoxId = `box${boxIds.length + 1}`;
//     setBoxIds((prevBoxIds) => [...prevBoxIds, newBoxId]);
//   };

//   const boxWidth = expanded ? 270 : 320;

//   return (
//     <div className="carousel-outer-wrapper">
//       <button
//         className="carousel-button left"
//         onClick={prev}
//         disabled={currentIndex === 0}
//       >
//         ‹
//       </button>

//       <div className="carousel-inner-wrapper">
//         <div
//           className="carousel-track"
//           style={{
//             transform: `translateX(-${currentIndex * boxWidth}px)`,
//             transition: "transform 0.5s ease",
//           }}
//         >
//           {boxIds.map((boxId) => (
//             <SemesterBox
//               key={boxId}
//               boxId={boxId}
//               selectedSemester={boxSelections[boxId] || ""}
//               availableSemesters={getAvailableSemesters()}
//               onSemesterSelect={handleSemesterSelect}
//               onDragOver={handleDragOver}
//               onDrop={(e) => {
//                 const selected = boxSelections[boxId];
//                 if (selected) handleSemesterDrop(e, selected);
//               }}
//               expanded={expanded}
//             >
//               {(boxSelections[boxId] &&
//                 getCoursesForSemester(boxSelections[boxId]).map((course) => (
//                   <CourseDrag
//                     key={course.id}
//                     id={course.id}
//                     courseCode={course.courseCode}
//                     courseTitle={course.courseTitle}
//                     semesterId={boxSelections[boxId]}
//                     isEmpty={false}
//                     isEditing={course.isEditing}
//                     onDragStart={handleDragStart}
//                     onDragEnd={handleDragEnd}
//                     onSaveCourse={handleSaveCourse}
//                     prereqMet={course.prereqMet}
//                   />
//                 ))) ||
//                 null}

//               {boxSelections[boxId] &&
//                 Array(emptySlots[boxSelections[boxId]] || 0)
//                   .fill(0)
//                   .map((_, i) => (
//                     <CourseDrag
//                       key={`empty-${boxId}-${i}`}
//                       id={`empty-${boxId}-${i}`}
//                       courseCode=""
//                       courseTitle=""
//                       semesterId={boxSelections[boxId]}
//                       isEmpty={true}
//                       onDragOver={handleDragOver}
//                       onDrop={(e) =>
//                         handleSemesterDrop(e, boxSelections[boxId])
//                       }
//                     />
//                   ))}

//               {boxSelections[boxId] && (
//                 <button
//                   className="add-course-button"
//                   onClick={() =>
//                     addCourse(boxSelections[boxId], undefined, "new")
//                   }
//                 >
//                   + New course
//                 </button>
//               )}
//             </SemesterBox>
//           ))}

//           <div className={`add-box ${expanded ? "expanded" : "collapsed"}`}>
//             <button className="add-button" onClick={handleAddSemester}>
//               <div className="add-button-plus">+</div>
//               <div>New Semester</div>
//             </button>
//           </div>
//         </div>
//       </div>

//       <button
//         className="carousel-button right"
//         onClick={next}
//         disabled={currentIndex === maxIndex}
//       >
//         ›
//       </button>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import SemesterBox from "./SemesterBox";
import CourseDrag from "./CourseDrag";
import { CarouselMover } from "../hooks/CarouselMover";
import { CourseDragManager } from "../hooks/CourseDragManager";
import { CourseItem } from "../types";
import { useUser } from "@clerk/clerk-react";
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

          for (const [semester, courseList] of Object.entries(semestersData)) {
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

  const handleSemesterDrop = async (e: React.DragEvent, semesterId: string) => {
    e.preventDefault();
    const searchCourseRaw = e.dataTransfer.getData("searchCourse");
    const courseId = e.dataTransfer.getData("courseId");

    if (searchCourseRaw) {
      const searchCourse = JSON.parse(searchCourseRaw);
      const newCourse: CourseItem = {
        id: `course-${Date.now()}`,
        courseCode: searchCourse.courseCode,
        title: searchCourse.courseName,
        semesterId,
        isEditing: false,
        prereqsMet: false,
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
      try {
        await fetch(
          `http://localhost:3232/add-course?uid=${
            user?.id
          }&code=${encodeURIComponent(
            newCourse.courseCode
          )}&title=${encodeURIComponent(
            newCourse.title
          )}&term=${term}&year=${year}`,
          { method: "POST" }
        );
      } catch (err) {
        console.error("Error saving course:", err);
      }
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
