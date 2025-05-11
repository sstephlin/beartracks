import { useState } from "react";
import SearchBar from "./SearchBar";
import Carousel from "./Carousel";
import { Trash2 } from "lucide-react";
import "../styles/BearTracks.css";
import { useUser } from "@clerk/clerk-react";

interface BearTracksProps {
  expanded: boolean;
  setRefreshSidebar: React.Dispatch<React.SetStateAction<boolean>>;
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
    // Call the Carousel's handler through a custom event
    window.dispatchEvent(
      new CustomEvent("searchCourseDragStart", {
        detail: { course },
      })
    );
  };

  const handleDragEndSearchCourse = (e: React.DragEvent) => {
    setDraggedSearchCourse(null);
  };

  // Modified function to handle drop in the larger trash zone
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
      console.log("🗑 Dropped to trash:", { courseCode, semesterId });
      try {
        await fetch(url, { method: "POST" });
      } catch (error) {
        console.error("Failed to remove from backend:", error);
      }
    }
    props.setRefreshSidebar((prev) => !prev);
  };

  // Function to check if element is near the trash can
  const handleDragOverTrashZone = (e: React.DragEvent) => {
    e.preventDefault();
    // Always set hover state to true when something is dragged over the trash zone
    // The actual check for valid data will happen on drop
    setIsTrashHovered(true);
  };

  return (
    <div
      className={`bear-tracks-container ${
        props.expanded ? "expanded" : "collapsed"
      }`}
    >
      <div className="searchbar-and-trash-container">
        <SearchBar onSearch={handleSearch} />
        <div className="display-view">
          {[2, 4].map((value) => (
            <button
              key={value}
              onClick={() => setViewCount(value)}
              className={`display-view-button ${
                viewCount === value ? "selected" : "unselected"
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {searchResults.length > 0 && (
        <div
          className={`search-results-container ${
            props.expanded ? "expanded" : "collapsed"
          }`}
        >
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
        setRefreshSidebar={props.setRefreshSidebar}
      />
      {/* Enlarged trash area with the visible trash can in the center */}
      <div
        className="enlarged-trash-zone"
        onDragOver={handleDragOverTrashZone}
        onDragLeave={() => setIsTrashHovered(false)}
        onDrop={handleDropToTrash}
      >
        <div className={`trash-area ${isTrashHovered ? "trash-hovered" : ""}`}>
          <Trash2 size={48} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}
