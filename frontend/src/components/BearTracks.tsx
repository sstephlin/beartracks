import { useState } from "react";
import SearchBar from "./SearchBar";
import Carousel from "./Carousel";
import { Trash2 } from "lucide-react";
import "../styles/BearTracks.css";

interface BearTracksProps {
  expanded: boolean;
}
export default function BearTracks(props: BearTracksProps) {
  const [viewCount, setViewCount] = useState<number>(2);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [draggedSearchCourse, setDraggedSearchCourse] = useState<any | null>(
    null
  );
  const [isTrashHovered, setIsTrashHovered] = useState(false);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:1234/search-course?query=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (data.result === "success") {
        setSearchResults(data.courses);
      } else {
        console.error(data.message);
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error during search:", error);
      setSearchResults([]);
    }
  };

  const handleDragStartSearchCourse = (e: React.DragEvent, course: any) => {
    e.dataTransfer.setData("searchCourse", JSON.stringify(course));
    setDraggedSearchCourse(course);
  };

  const handleDragEndSearchCourse = (e: React.DragEvent) => {
    setDraggedSearchCourse(null);
  };

  const handleDropToTrash = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsTrashHovered(false);

    const courseId = e.dataTransfer.getData("courseId");
    const semesterId = e.dataTransfer.getData("semesterId");
    const courseCode = e.dataTransfer.getData("courseCode");
    const courseTitle = e.dataTransfer.getData("courseTitle");

    if (courseId && semesterId) {
      // 🧹 Dispatch an event to update frontend immediately
      window.dispatchEvent(
        new CustomEvent("removeCourse", {
          detail: { courseId, semesterId },
        })
      );

      // 🧹 Then call backend (optional: you can await, or just fire and forget)
      const [term, year] = semesterId.split(" ");
      const uid = "test"; // replace with real UID
      const url = `http://localhost:1234/remove-course?uid=${uid}&code=${encodeURIComponent(
        courseCode
      )}&title=${encodeURIComponent(courseTitle)}&term=${term}&year=${year}`;

      try {
        await fetch(url, { method: "POST" });
      } catch (error) {
        console.error("Failed to remove from backend:", error);
      }
    }
  };

  return (
    <div className="bear-tracks-container">
      <div className="searchbar-and-trash-container">
        <SearchBar onSearch={handleSearch} />
        {/* 🧹 Trash area */}
        <div
          className={`trash-area ${isTrashHovered ? "trash-hovered" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsTrashHovered(true);
          }}
          onDragLeave={() => setIsTrashHovered(false)}
          onDrop={handleDropToTrash}
        >
          <Trash2 size={30} />
        </div>
      </div>

      {searchResults.length > 0 && (
        <div className="search-results-container">
          {searchResults.map((course, index) => (
            <div
              key={index}
              className="search-course-block"
              draggable
              onDragStart={(e) => handleDragStartSearchCourse(e, course)}
              onDragEnd={handleDragEndSearchCourse}
            >
              <div className="course-code">{course.courseCode}</div>
              <div className="course-title">{course.courseName}</div>
            </div>
          ))}
        </div>
      )}

      <Carousel
        viewCount={viewCount}
        setViewCount={setViewCount}
        draggedSearchCourse={draggedSearchCourse}
        expanded={props.expanded}
      />
    </div>
  );
}
