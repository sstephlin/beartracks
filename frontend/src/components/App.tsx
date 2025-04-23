// import { initializeApp } from "firebase/app";
import "../styles/App.css";
import BearTracks from "./BearTracks";
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
            <a href="index.html" className="logo">
              BearTracks
            </a>
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
    </div>
  );
}

export default App;
