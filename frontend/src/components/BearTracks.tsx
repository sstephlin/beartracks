import { useState } from "react";
import Carousel from "./Carousel";
import "../styles/BearTracks.css";
import { useUser } from "@clerk/clerk-react";
import { sessionStorageUtils } from "../utils/sessionStorageUtils";

// this defines the props for the BearTracks component
interface BearTracksProps {
  expanded: boolean;
  setRefreshSidebar: React.Dispatch<React.SetStateAction<boolean>>;
  draggedSearchCourse: any | null;
}

// constant variables
export default function BearTracks(props: BearTracksProps) {
  const { user } = useUser();
  const uid = user?.id;
  const [viewCount, setViewCount] = useState<string>("2");

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
      {/* Removed search bar and results - now in App header */}

      <Carousel
        viewCount={viewCount}
        setViewCount={setViewCount}
        draggedSearchCourse={props.draggedSearchCourse}
        expanded={props.expanded}
        setRefreshSidebar={props.setRefreshSidebar}
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
