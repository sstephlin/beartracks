import "../styles/App.css";
import Sidebar from "./Sidebar";
import BearTracks from "./BearTracks";
import SearchBar from "./SearchBar";
import GuidedTour from "./GuidedTour";
import { HelpCircle } from "lucide-react";
import { useState } from "react";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";

// App function with the constant variables
function App() {
  const [expanded, setExpanded] = useState<boolean>(true);
  const [degree, setDegree] = useState<string>("");
  const [refreshSidebar, setRefreshSidebar] = useState(false);
  const [showGuidedTour, setShowGuidedTour] = useState(false);
  const [numCompleted, setNumCompleted] = useState(0);
  const [numRequired, setNumRequired] = useState(0);
<<<<<<< HEAD
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [draggedSearchCourse, setDraggedSearchCourse] = useState<any | null>(null);

  // Handle search functionality
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
=======
  const [currentCapstoneCourse, setCurrentCapstoneCourse] = useState<string | null>(null);

  const handleClickOutside = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains("disclaimer-overlay")) {
      setShowDisclaimer(false);
>>>>>>> 3487c8a47a885fb3e09d6b1e4a2a7b72d47afd33
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

  // Handle dragging course from search results
  const handleDragStartSearchCourse = (e: React.DragEvent, course: any) => {
    e.dataTransfer.setData("searchCourse", JSON.stringify(course));
    setDraggedSearchCourse(course);
    window.dispatchEvent(
      new CustomEvent("searchCourseDragStart", {
        detail: { course },
      })
    );
  };

  const handleDragEndSearchCourse = (e: React.DragEvent) => {
    setDraggedSearchCourse(null);
  };

  const handleCapstoneChange = (courseCode: string | null) => {
    console.log('Capstone changed to:', courseCode);
    setCurrentCapstoneCourse(courseCode);
  };

  // returns the provided constant variables
  return (
    <div className="App">
      <div className="layout-container">
        <Sidebar
          expanded={expanded}
          setExpanded={setExpanded}
          degree={degree}
          setDegree={setDegree}
          refreshSidebar={refreshSidebar}
          numCompleted={numCompleted}
          numRequired={numRequired}
          setNumCompleted={setNumCompleted}
          setNumRequired={setNumRequired}
          currentCapstoneCourse={currentCapstoneCourse}
        />
        <div className={`header-and-content ${!expanded ? "collapsed" : ""}`}>
          <header
            className={`App-header ${
              expanded ? "header-sidebar-expanded" : "header-sidebar-collapsed"
            }`}
          >
            {/* handles the logo on display */}
            <div className="logo">
              <div className="logo-title">
                <a href="index.html" className="logo-link">
                  <span className="logo-text">BearTracks</span>
                  <img
                    src="/beartracks_logo.png"
                    alt="Bear Icon"
                    className="logo-icon"
                  />
                </a>
              </div>
              {/* handles the progress bar */}
              <div className="progress-row">
                <progress
                  className="logo-progress"
                  value={
                    numRequired === 0 ? 0 : (numCompleted / numRequired) * 100
                  }
                  max={100}
                ></progress>
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "#444",
                    marginTop: "4px",
                  }}
                >
                  {numCompleted} / {numRequired}
                </p>
              </div>
            </div>
            
            {/* Search bar in header */}
            <div className="header-search-container">
              <SearchBar onSearch={handleSearch} />
            </div>
            
            {/* handles the sign in button */}
            <div className="Sign-in-out-container">
              <SignedOut>
                <SignInButton />
              </SignedOut>
              <SignedIn>
                <div className="signed-in-buttons">
                  <UserButton />
                </div>
              </SignedIn>
            </div>
          </header>
          
          {/* Search results section */}
          {searchResults.length > 0 && (
            <div className={`search-results-container ${
              expanded ? "expanded" : "collapsed"
            }`}>
              {searchResults.map((course, index) => (
                <div
                  key={index}
                  className="search-course-block"
                  draggable
                  onDragStart={(e) => handleDragStartSearchCourse(e, course)}
                  onDragEnd={handleDragEndSearchCourse}
                  aria-label={`Course ${course.courseCode}: ${course.courseName}`}
                  role="button"
                  tabIndex={0}
                >
                  <div className="course-code">{course.courseCode}</div>
                  <div className="course-title">{course.courseName}</div>
                </div>
              ))}
            </div>
          )}
          
          <main className="main-content">
            <BearTracks
              expanded={expanded}
              setRefreshSidebar={setRefreshSidebar}
<<<<<<< HEAD
              draggedSearchCourse={draggedSearchCourse}
=======
              onCapstoneChange={handleCapstoneChange}
>>>>>>> 3487c8a47a885fb3e09d6b1e4a2a7b72d47afd33
            />

            <div>
              <button
                className="floating-icon help-icon"
                onClick={() => setShowGuidedTour(true)}
                title="Start Guided Tour"
              >
                <HelpCircle />
              </button>
            </div>
            
            {/* Guided Tour */}
            {showGuidedTour && (
              <GuidedTour onClose={() => setShowGuidedTour(false)} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
