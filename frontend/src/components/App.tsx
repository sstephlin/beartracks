import "../styles/App.css";
import Sidebar from "./Sidebar";
import BearTracks from "./BearTracks";
import { HelpCircle } from "lucide-react";
import { useState } from "react";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";

function App() {
  const [expanded, setExpanded] = useState<boolean>(true);
  const [degree, setDegree] = useState<string>("");

  // add state to toggle visibility of disclaimer
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // click outside the modal box closes it
  const handleClickOutside = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains("disclaimer-overlay")) {
      setShowDisclaimer(false);
    }
  };

  return (
    <div className="App">
      <div className="layout-container">
        <Sidebar
          expanded={expanded}
          setExpanded={setExpanded}
          degree={degree}
          setDegree={setDegree}
        />
        <div className="header-and-content">
          <header
            className={`App-header ${
              expanded ? "header-sidebar-expanded" : "header-sidebar-collapsed"
            }`}
          >
            <div className="logo">
              <div className="logo-title">
                <a href="index.html" className="logo-link">
                  <img
                    src="/beartracks_logo2.png"
                    alt="Bear Logo"
                    className="logo-image"
                  />
                  BearTracks
                </a>
              </div>
              <progress
                className="logo-progress"
                value={40}
                max={100}
              ></progress>
            </div>
            <div className="Sign-in-out-container">
              <SignedOut>
                <SignInButton />
              </SignedOut>
              <SignedIn>
                <div className="signed-in-buttons">
                  <h3>Welcome!</h3>
                  <UserButton />
                </div>
              </SignedIn>
            </div>
          </header>
          <main className="main-content">
            <BearTracks expanded={expanded} />

            {/* floating help icon that toggles the disclaimer */}
            <div>
              <button
                className="floating-icon help-icon"
                onClick={() => setShowDisclaimer(true)} // shows the disclaimer when clicked
              >
                <HelpCircle />
              </button>
            </div>

            {/* model disclaimer component */}
            {showDisclaimer && (
              <div
                className="disclaimer-overlay" // full-screen background (for visual effects)
                onClick={handleClickOutside} // close when clicking outside box
              >
                <div className="disclaimer-box">
                  {/* close button in the top right of the box */}
                  <button
                    className="close-disclaimer"
                    onClick={() => setShowDisclaimer(false)}
                  >
                    ×
                  </button>
                  {/* modal content */}
                  <h2>How to Use BearTracks</h2>
                  <p>
                    Search for courses and drag and drop them into semesters.
                    Use the trash icon to remove courses. Click "+ New Course"
                    to add a new course.
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
