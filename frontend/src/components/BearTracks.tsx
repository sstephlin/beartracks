import { useState } from "react";
import SearchBar from "./SearchBar";
import Carousel from "./Carousel";
import { Trash2 } from "lucide-react";
import "../styles/BearTracks.css";
import { useUser } from "@clerk/clerk-react";

interface BearTracksProps {
  expanded: boolean;
}
export default function BearTracks(props: BearTracksProps) {
  const { user } = useUser();
  const uid = user?.id;
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
        `http://localhost:3232/search-course?query=${encodeURIComponent(query)}`
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

    const semesterId = e.dataTransfer.getData("semesterId");
    const courseCode = e.dataTransfer.getData("courseCode");
    const title = e.dataTransfer.getData("title");

    if (courseCode && semesterId) {
      window.dispatchEvent(
        new CustomEvent("removeCourse", {
          detail: { courseCode, semesterId }, // ✅ use courseCode instead of courseId
        })
      );

      const [term, year] = semesterId.split(" ");
      if (!uid) return;

      const url = `http://localhost:3232/remove-course?uid=${uid}&code=${encodeURIComponent(
        courseCode
      )}&title=${encodeURIComponent(title)}&term=${term}&year=${year}`;

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
