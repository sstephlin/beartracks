import { useState } from "react";
import SearchBar from "./SearchBar";
import Carousel from "./Carousel";
import { Trash2 } from "lucide-react";
import "../styles/BearTracks.css";

function BearTracks() {
  const [viewCount, setViewCount] = useState<number>(2);
  const [semesters, setSemesters] = useState<string[]>([
    "fall-2026",
    "spring-2027",
    "fall-2027",
    "spring-2028",
  ]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [draggedSearchCourse, setDraggedSearchCourse] = useState<any | null>(
    null
  );

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

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

  return (
    <div className="bear-tracks-container">
      <div className="searchbar-and-trash-container">
        <SearchBar onSearch={handleSearch} />
        <button className="trash-near-search">
          <Trash2 />
        </button>
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
        semesters={semesters}
        draggedSearchCourse={draggedSearchCourse}
      />
    </div>
  );
}

export default BearTracks;
