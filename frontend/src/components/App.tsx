import React from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import { HelpCircle } from "lucide-react";
import BearTracks from "./BearTracks";
import Sidebar from "./Sidebar";

export default function App() {
  const [expanded, setExpanded] = React.useState(true);
  const [degree, setDegree] = React.useState("");

  return (
    <div className="App layout-container">
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
            <progress className="logo-progress" value={40} max={100}></progress>
          </div>

          {/* SignIn Area */}
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
        </main>
      </div>

      {/* Floating Help Button */}
      <button
        className="floating-icon help-icon"
        onClick={() => console.log("Help clicked")}
      >
        <HelpCircle />
      </button>
    </div>
  );
}
