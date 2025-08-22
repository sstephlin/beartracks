import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import "../styles/UserGuide.css";

interface UserGuideProps {
  onClose: () => void;
}

interface GuideStep {
  title: string;
  content: JSX.Element;
  image?: string;
}

export default function UserGuide({ onClose }: UserGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const guideSteps: GuideStep[] = [
    {
      title: "Welcome to BearTracks!",
      content: (
        <div>
          <p>BearTracks is your personal course planner for organizing your academic journey.</p>
          <br />
          <p><strong>Key Features:</strong></p>
          <ul>
            <li>📚 Plan your courses across multiple semesters</li>
            <li>🔍 Search for courses by code or title</li>
            <li>✅ Track prerequisite requirements</li>
            <li>🎯 Monitor concentration progress</li>
            <li>💾 Save your progress (with or without signing in)</li>
          </ul>
          <br />
          <p>Let's walk through how to use each feature...</p>
        </div>
      ),
    },
    {
      title: "Adding Semesters",
      content: (
        <div>
          <p><strong>How to add a new semester:</strong></p>
          <ol>
            <li>Look for the <strong>"+ Add Semester"</strong> box in your course grid</li>
            <li>Click on it to see available semesters</li>
            <li>Select your desired semester (e.g., "Fall 2025", "Spring 2026")</li>
            <li>The semester box will be added to your plan</li>
          </ol>
          <br />
          <p><strong>💡 Tip:</strong> Semesters are automatically sorted chronologically when you refresh the page, or you can click the "Sort Semesters" button to organize them instantly!</p>
        </div>
      ),
    },
    {
      title: "Searching for Courses",
      content: (
        <div>
          <p><strong>The search bar at the top is powerful and flexible:</strong></p>
          <br />
          <p>📍 <strong>Search by Course Code:</strong></p>
          <ul>
            <li>Type "CSCI" to see all Computer Science courses</li>
            <li>Type "CSCI0320" for a specific course</li>
            <li>Type "MATH" for all Mathematics courses</li>
          </ul>
          <br />
          <p>🔤 <strong>Search by Keywords in Title:</strong></p>
          <ul>
            <li>Type "introduction" to find introductory courses</li>
            <li>Type "data" to find data-related courses</li>
            <li>Type "programming" to find programming courses</li>
          </ul>
          <br />
          <p><strong>💡 Tip:</strong> Search results appear below the header. Simply drag any course from the results into your desired semester!</p>
        </div>
      ),
    },
    {
      title: "The Three-Dot Menu",
      content: (
        <div>
          <p><strong>Each semester box has a ⋮ (three-dot) menu with useful options:</strong></p>
          <br />
          <ol>
            <li><strong>📝 Rename Semester:</strong> Change the semester if you made a mistake</li>
            <li><strong>🗑️ Delete Semester:</strong> Remove a semester and all its courses</li>
            <li><strong>➕ Add Manual Course:</strong> Add a custom course not in the catalog (see next step)</li>
          </ol>
          <br />
          <p><strong>How to access:</strong></p>
          <ul>
            <li>Click the ⋮ button in the top-right corner of any semester box</li>
            <li>A dropdown menu will appear with these options</li>
            <li>Click anywhere outside to close the menu</li>
          </ul>
        </div>
      ),
    },
    {
      title: "Adding Manual Courses",
      content: (
        <div>
          <p><strong>Need to add a transfer credit, special course, or placeholder?</strong></p>
          <br />
          <p><strong>Steps to add a manual course:</strong></p>
          <ol>
            <li>Click the ⋮ menu on the semester box</li>
            <li>Select "Add Manual Course"</li>
            <li>Enter the course code (e.g., "TRANSFER 101")</li>
            <li>Enter the course title (e.g., "Transfer Credit from XYZ University")</li>
            <li>Click "Add Course"</li>
          </ol>
          <br />
          <p><strong>📌 Manual courses are marked with:</strong></p>
          <ul>
            <li>A special indicator showing they're manually added</li>
            <li>No prerequisite checking (since they're custom)</li>
            <li>Full drag-and-drop capability between semesters</li>
          </ul>
        </div>
      ),
    },
    {
      title: "Selecting Your Concentration",
      content: (
        <div>
          <p><strong>Track your progress toward your CS concentration:</strong></p>
          <br />
          <p><strong>How to select a concentration:</strong></p>
          <ol>
            <li>Look at the <strong>left sidebar</strong></li>
            <li>Find the <strong>"Concentration"</strong> dropdown</li>
            <li>Click to see available concentrations</li>
            <li>Select your concentration (e.g., "Systems", "AI/ML", "Theory")</li>
          </ol>
          <br />
          <p><strong>What happens after selection:</strong></p>
          <ul>
            <li>✅ Your courses will be checked against concentration requirements</li>
            <li>📊 The progress bar shows completion status</li>
            <li>📋 Required courses are listed in the sidebar</li>
            <li>🎯 Completed requirements are marked in green</li>
          </ul>
        </div>
      ),
    },
    {
      title: "Additional Features",
      content: (
        <div>
          <p><strong>🎓 Capstone Designation:</strong></p>
          <ul>
            <li>Right-click any 1000+ level course</li>
            <li>Select "Set as Capstone" to designate your capstone course</li>
          </ul>
          <br />
          <p><strong>🔄 Prerequisites Checking:</strong></p>
          <ul>
            <li>Courses show ✅ when prerequisites are met</li>
            <li>Shows ❌ when prerequisites are missing</li>
            <li>Manual courses don't have prerequisite checking</li>
          </ul>
          <br />
          <p><strong>👁️ View Options:</strong></p>
          <ul>
            <li>Toggle between 2 or 4 semesters per row</li>
            <li>Click "Sort Semesters" to organize chronologically</li>
          </ul>
          <br />
          <p><strong>💾 Saving Progress:</strong></p>
          <ul>
            <li>Sign in to save your plan permanently</li>
            <li>Without signing in, your plan is saved in the browser</li>
          </ul>
        </div>
      ),
    },
    {
      title: "Tips & Tricks",
      content: (
        <div>
          <p><strong>🚀 Pro Tips for Using BearTracks:</strong></p>
          <br />
          <ul>
            <li>📱 <strong>Drag and Drop:</strong> Move courses between semesters by dragging them</li>
            <li>🗑️ <strong>Delete Courses:</strong> Drag courses to the trash can to remove them</li>
            <li>🔍 <strong>Quick Search:</strong> Start typing immediately to search for courses</li>
            <li>📊 <strong>Progress Tracking:</strong> Check the header progress bar for overall completion</li>
            <li>🎯 <strong>Concentration Progress:</strong> Monitor the sidebar for detailed requirements</li>
          </ul>
          <br />
          <p><strong>⚠️ Important Notes:</strong></p>
          <ul>
            <li>Some courses may not be offered every semester</li>
            <li>Always verify prerequisites with official course catalog</li>
            <li>Consult with your advisor for final course planning</li>
          </ul>
          <br />
          <p className="guide-footer">Happy planning! 🐻</p>
        </div>
      ),
    },
  ];

  const nextStep = () => {
    if (currentStep < guideSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains("user-guide-overlay")) {
      onClose();
    }
  };

  return (
    <div className="user-guide-overlay" onClick={handleOverlayClick}>
      <div className="user-guide-modal">
        <button className="guide-close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="guide-content">
          <div className="guide-header">
            <h2>{guideSteps[currentStep].title}</h2>
            <div className="guide-progress">
              Step {currentStep + 1} of {guideSteps.length}
            </div>
          </div>

          <div className="guide-body">
            {guideSteps[currentStep].content}
          </div>

          <div className="guide-navigation">
            <button
              className="guide-nav-btn"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ChevronLeft size={20} />
              Previous
            </button>

            <div className="guide-dots">
              {guideSteps.map((_, index) => (
                <span
                  key={index}
                  className={`guide-dot ${index === currentStep ? "active" : ""}`}
                  onClick={() => setCurrentStep(index)}
                />
              ))}
            </div>

            {currentStep === guideSteps.length - 1 ? (
              <button className="guide-nav-btn guide-finish-btn" onClick={onClose}>
                Get Started!
              </button>
            ) : (
              <button className="guide-nav-btn" onClick={nextStep}>
                Next
                <ChevronRight size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}