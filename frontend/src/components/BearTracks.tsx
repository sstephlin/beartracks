import { useState } from "react";
import Carousel from "./Carousel";
import { Trash2 } from "lucide-react";
import "../styles/BearTracks.css";
import { useUser } from "@clerk/clerk-react";
import { sessionStorageUtils } from "../utils/sessionStorageUtils";

// this defines the props for the BearTracks component
interface BearTracksProps {
  expanded: boolean;
  setRefreshSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  draggedSearchCourse: any;
  // NEW: Add callback to notify parent about capstone changes
  onCapstoneChange?: (courseCode: string | null) => void;
}

// constant variables
export default function BearTracks(props: BearTracksProps) {
  const { user } = useUser();
  const uid = user?.id;
  const [viewCount, setViewCount] = useState<string>("2");
  const [isTrashHovered, setIsTrashHovered] = useState(false);

  // NEW: Handler to pass capstone changes up to parent
  const handleCapstoneChange = (courseCode: string | null) => {
    if (props.onCapstoneChange) {
      props.onCapstoneChange(courseCode);
    }
  };


  // this is in charge of dragging to the trash can
  const handleDropToTrash = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsTrashHovered(false);

    const semesterId = e.dataTransfer.getData("semesterId");
    const courseCode = e.dataTransfer.getData("courseCode");
    const title = e.dataTransfer.getData("title");

    if (courseCode && semesterId) {
      window.dispatchEvent(
        new CustomEvent("removeCourse", {
          detail: { courseCode, semesterId },
        })
      );

      const [term, year] = semesterId.split(" ");
      if (!uid) return;

      const url = `${
        import.meta.env.VITE_BACKEND_URL
      }/remove-course?uid=${uid}&code=${encodeURIComponent(
        courseCode
      )}&title=${encodeURIComponent(title)}&term=${term}&year=${year}`;
      console.log("Dropped to trash:", { courseCode, semesterId });
      try {
        await fetch(url, { method: "POST" });
      } catch (error) {
        console.error("Failed to remove from backend:", error);
      }
    }
    props.setRefreshSidebar((prev) => !prev);
  };

  // function that checks if element is near the trash can
  const handleDragOverTrashZone = (e: React.DragEvent) => {
    e.preventDefault();
    // this always sets hover state to true when something is dragged over the trash zone
    setIsTrashHovered(true);
  };

  async function handleViewCount(value: string) {
    setViewCount(value);
    
    if (!uid) {
      // Save to session storage for unsigned users
      const sessionData = sessionStorageUtils.getSessionData() || { courses: [], semesters: {} };
      sessionData.viewCount = value;
      sessionStorageUtils.saveSessionData(sessionData);
    } else {
      await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/store-view?uid=${uid}&view=${value}`,
        {
          method: "POST",
        }
      );
    }
  }

  return (
    <div
      className={`bear-tracks-container ${
        props.expanded ? "expanded" : "collapsed"
      }`}
    >

      <Carousel
        viewCount={viewCount}
        setViewCount={setViewCount}
        draggedSearchCourse={props.draggedSearchCourse}
        expanded={props.expanded}
        setRefreshSidebar={props.setRefreshSidebar}
        onCapstoneChange={handleCapstoneChange} // NEW: Pass capstone change handler
      />

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
    </div>
  );
}