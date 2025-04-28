// import SearchBar from "./SearchBar.tsx";

// const handleSearch = (query: string) => {
//   console.log("Search query:", query);
//   // You can filter a list, trigger an API, etc.
// };

// function BearTracks() {
//   return (
//     <div>
//       <SearchBar onSearch={handleSearch} />
//       <p>search</p>
//     </div>
//   );
// }
// export default BearTracks;

import React, { useState } from 'react';
import SearchBar from "./SearchBar.tsx";
import SemesterBox from "./SemesterBox";
import CourseSlot from "./CourseDrag.tsx";

interface Course {
  id: string;
  courseCode: string;
  courseTitle: string;
  semesterId: string;
}

function BearTracks() {
  // Initial courses data
  const [courses, setCourses] = useState<Course[]>([
    { 
      id: 'course-1', 
      courseCode: 'CSCI 1430', 
      courseTitle: 'Computer Vision', 
      semesterId: 'spring-2027' 
    }
  ]);

  const [emptySlots, setEmptySlots] = useState<{ [key: string]: number }>({});

  
  // Track the course being dragged
  const [draggedCourse, setDraggedCourse] = useState<string | null>(null);
  
  const handleSearch = (query: string) => {
    console.log("Search query:", query);
    // You can filter courses based on search
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, courseId: string) => {
    setDraggedCourse(courseId);
    e.dataTransfer.setData('courseId', courseId);
    
    // Type checking to ensure e.currentTarget is an HTMLElement
    setTimeout(() => {
      const target = e.currentTarget as HTMLElement;
      target.style.opacity = '0.4';
    }, 0);
  };
  
  const handleDragEnd = (e: React.DragEvent) => {
    // Type checking to ensure e.currentTarget is an HTMLElement
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedCourse(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetSemesterId: string) => {
    e.preventDefault();
    
    const courseId = e.dataTransfer.getData('courseId');
    
    if (courseId && draggedCourse) {
      // Update the course's semester
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course.id === courseId 
            ? {...course, semesterId: targetSemesterId}
            : course
        )
      );
    }
  };

  // Function to add a new course to a semester
  const addCourse = (semesterId: string) => {
    const coursesInSemester = getCoursesForSemester(semesterId);
    // prevents from adding more than 5 classes
    if (coursesInSemester.length >= 10) return; 
    const newCourse = {
      id: `course-${Date.now()}`, // Generate a unique ID
      courseCode: 'NEW COURSE',
      courseTitle: 'Click to edit...',
      semesterId
    };
    
    setCourses([...courses, newCourse]);

    setEmptySlots(prev => ({
      ...prev,
      [semesterId]: Math.min((prev[semesterId] || 0) + 0, 5)
    }))
  };

  // Get courses for a specific semester
  const getCoursesForSemester = (semesterId: string) => {
    return courses.filter(course => course.semesterId === semesterId);
  };

  return (
    <div className="bear-tracks-container">
      <SearchBar onSearch={handleSearch} />
      
      <div className="semester-boxes-wrapper">
        <SemesterBox 
          title="FALL 2026"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'fall-2026')}
        >
          {getCoursesForSemester('fall-2026').map(course => (
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
          
          {/* Add empty slots to make up to 5 */}
          {/* {Array(5 - getCoursesForSemester('fall-2026').length).fill(0).map((_, i) => ( */}
          {Array(emptySlots['fall-2026'] || 0).fill(0).map((_, i) => (  
            <CourseSlot 
              key={`empty-fall-2026-${i}`}
              id={`empty-fall-2026-${i}`}
              isEmpty={true}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'fall-2026')}
            />
          ))}
          
          <button 
            className="add-course-button"
            onClick={() => addCourse('fall-2026')}
          >
            + New course
          </button>
        </SemesterBox>
        
        <SemesterBox 
          title="SPRING 2027"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'spring-2027')}
        >
          {getCoursesForSemester('spring-2027').map(course => (
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
          
          {/* Add empty slots to make up to 5 */}
          {Array(emptySlots['spring-2027'] || 0).fill(0).map((_, i) => (  
            <CourseSlot 
              key={`empty-spring-2027-${i}`}
              id={`empty-spring-2027-${i}`}
              isEmpty={true}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'spring-2027')}
            />
          ))}

          <button 
            className="add-course-button"
            onClick={() => addCourse('spring-2027')}
          >
            + New course
          </button>
        </SemesterBox>
        
        <SemesterBox 
          title="FALL 2027"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'fall-2027')}
        >
          {getCoursesForSemester('fall-2027').map(course => (
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
          
          {/* Add empty slots to make up to 5 */}
          {Array(emptySlots['fall-2027'] || 0).fill(0).map((_, i) => (  
            <CourseSlot 
              key={`empty-fall-2027-${i}`}
              id={`empty-fall-2027-${i}`}
              isEmpty={true}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'fall-2076')}
            />
          ))}
          
          <button 
            className="add-course-button"
            onClick={() => addCourse('fall-2027')}
          >
            + New course
          </button>
        </SemesterBox>
        
        <SemesterBox 
          title="SPRING 2028"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'spring-2028')}
        >
          {getCoursesForSemester('spring-2028').map(course => (
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
          
          {/* Add empty slots to make up to 5 */}
          {Array(emptySlots['spring-2028'] || 0).fill(0).map((_, i) => (  
            <CourseSlot 
              key={`empty-spring-2028-${i}`}
              id={`empty-spring-2028-${i}`}
              isEmpty={true}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'spring-2028')}
            />
          ))}
          
          <button 
            className="add-course-button"
            onClick={() => addCourse('spring-2028')}
          >
            + New course
          </button>
        </SemesterBox>
      </div>
    </div>
  );
}

export default BearTracks;