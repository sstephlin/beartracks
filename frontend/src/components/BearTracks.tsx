import { useState, useEffect, useRef } from "react";
import Carousel from "./Carousel";
import "../styles/BearTracks.css";
import { useUser } from "@clerk/clerk-react";
import { sessionStorageUtils } from "../utils/sessionStorageUtils";

// this defines the props for the BearTracks component
interface BearTracksProps {
  expanded: boolean;
  setRefreshSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  draggedSearchCourse: any | null;
  // NEW: Add callback to notify parent about capstone changes
  onCapstoneChange?: (courseCode: string | null) => void;
}

// constant variables
export default function BearTracks(props: BearTracksProps) {
  const { user } = useUser();
  const uid = user?.id;
  const [viewCount, setViewCount] = useState<string>("2");
  const [showSortNotification, setShowSortNotification] = useState<
    string | null
  >(null);
  const carouselRef = useRef<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [draggedSearchCourse, setDraggedSearchCourse] = useState<any | null>(
    null
  );
  const [isTrashHovered, setIsTrashHovered] = useState(false);

  // NEW: Handler to pass capstone changes up to parent
  const handleCapstoneChange = (courseCode: string | null) => {
    if (props.onCapstoneChange) {
      props.onCapstoneChange(courseCode);
    }
  };

  // this handles searching courses from the backend
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/search-course?query=${encodeURIComponent(query)}`
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

  // this is in charge when the user drags a course from the search results
  const handleDragStartSearchCourse = (e: React.DragEvent, course: any) => {
    e.dataTransfer.setData("searchCourse", JSON.stringify(course));
    setDraggedSearchCourse(course);
    window.dispatchEvent(
      new CustomEvent("searchCourseDragStart", {
        detail: { course },
      })
    );
  };

  // this is in charge when the dragging ends
  const handleDragEndSearchCourse = (e: React.DragEvent) => {
    setDraggedSearchCourse(null);
  };

  async function handleViewCount(value: string) {
    setViewCount(value);

    if (!uid) {
      // Save to session storage for unsigned users
      const sessionData = sessionStorageUtils.getSessionData() || {
        courses: [],
        semesters: {},
      };
      sessionData.viewCount = value;
      sessionStorageUtils.saveSessionData(sessionData);
    } else {
      await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/store-view?uid=${uid}&view=${value}`,
        {
          method: "POST",
        }
      );
    }
  }

  const handleSortSemesters = () => {
    if (carouselRef.current && carouselRef.current.sortSemesters) {
      const result = carouselRef.current.sortSemesters();
      if (result === "already_sorted") {
        setShowSortNotification("Semesters are already sorted");
      } else {
        setShowSortNotification("Semesters have been sorted");
      }

      // Hide notification after 3 seconds
      setTimeout(() => {
        setShowSortNotification(null);
      }, 2000);
    }
  };

  return (
    <div
      className={`bear-tracks-container ${
        props.expanded ? "expanded" : "collapsed"
      }`}
    >
      {/* Removed search bar and results - now in App header */}

      <Carousel
        viewCount={viewCount}
        setViewCount={setViewCount}
        draggedSearchCourse={props.draggedSearchCourse}
        expanded={props.expanded}
        setRefreshSidebar={props.setRefreshSidebar}
        ref={carouselRef}
        onCapstoneChange={handleCapstoneChange} // NEW: Pass capstone change handler
      />

      <div className="view-and-sort-container">
        <div className="display-view">
          {["2", "4"].map((value) => (
            <button
              key={value}
              onClick={() => handleViewCount(value)}
              className={`display-view-button ${
                viewCount === value ? "selected" : "unselected"
              }`}
            >
              {value}
            </button>
          ))}
        </div>

        <button onClick={handleSortSemesters} className="sort-semesters-button">
          Sort Semesters
        </button>
      </div>

      {showSortNotification && (
        <div
          className={`sort-notification ${
            showSortNotification === "Semesters are already sorted"
              ? "already-sorted"
              : ""
          }`}
        >
          {showSortNotification}
        </div>
      )}
    </div>
  );
}
