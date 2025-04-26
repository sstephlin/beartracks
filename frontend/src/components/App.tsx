// import { initializeApp } from "firebase/app";
import "../styles/App.css";
import BearTracks from "./BearTracks";
import { Trash2, HelpCircle } from "lucide-react";
// import MapsGearup from "./Maps";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  UserButton,
} from "@clerk/clerk-react";

// REMEMBER TO PUT YOUR API KEY IN A FOLDER THAT IS GITIGNORED!!
// (for instance, /src/private/api_key.tsx)
// import {API_KEY} from "./private/api_key"

// const firebaseConfig = {
//   apiKey: process.env.API_KEY,
//   authDomain: process.env.AUTH_DOMAIN,
//   projectId: process.env.PROJECT_ID,
//   storageBucket: process.env.STORAGE_BUCKET,
//   messagingSenderId: process.env.MESSAGING_SENDER_ID,
//   appId: process.env.APP_ID,
// };

// initializeApp(firebaseConfig);

function App() {
  return (
    <div className="App">
      <div className="header-container">
        <header className="App-header">
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
          <div className="Sign-in-out-container">
            <SignedOut>
              <SignInButton />
            </SignedOut>
            <SignedIn>
              <div>
                <div className="signed-in-buttons">
                  <h3>Welcome!</h3>
                  <UserButton />
                </div>
              </div>
            </SignedIn>
          </div>
          <div className="Sign-in-out-container">
            <SignedOut>
              <SignInButton />
            </SignedOut>
            <SignedIn>
              <div>
                <div className="signed-in-buttons">
                  <h3>Welcome!</h3>
                  <UserButton />
                </div>
              </div>
            </SignedIn>
          </div>
        </header>
      </div>
      <div>
        <BearTracks />
      </div>
      {/* Trash icon globally positioned */}
      <button
        className="trash-global-icon"
        onClick={() => console.log("Trash clicked")}
      >
        <Trash2 />
      </button>

      {/* Question mark icon */}
      <button
        className="floating-icon help-icon"
        onClick={() => console.log("Help clicked")}
      >
        <HelpCircle />
      </button>
    </div>
  );
}

export default App;
