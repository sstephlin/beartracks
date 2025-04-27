import "../styles/App.css";
import Sidebar from "./Sidebar";
import BearTracks from "./BearTracks";
import { Trash2, HelpCircle } from "lucide-react";
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
                    src="/BearTracks.png"
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
            <BearTracks />
            {/* Floating action buttons */}
            <div>
              <button
                className="trash-global-icon"
                onClick={() => console.log("Trash clicked")}
              >
                <Trash2 />
              </button>
            </div>
            <div>
              <button
                className="floating-icon help-icon"
                onClick={() => console.log("Help clicked")}
              >
                <HelpCircle />
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
