import { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import "../styles/GuidedTour.css";

interface GuidedTourProps {
  onClose: () => void;
}

interface TourStep {
  target: string; // CSS selector for the element to highlight
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
  offset?: { x: number; y: number };
  requiresSidebar?: boolean; // New property to indicate if sidebar needs to be expanded
}

export default function GuidedTour({ onClose }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [sidebarWasCollapsed, setSidebarWasCollapsed] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const tourSteps: TourStep[] = [
    {
      target: "", // No target for welcome message
      title: "Welcome to BearTracks! 🐻",
      content:
        "Beartracks is your personal course planner for organizing your academic journey. Let's take a quick tour of the main features.",
      position: "center",
      offset: { x: 0, y: 0 },
    },
    {
      target: ".header-search-container",
      title: "Search for Courses",
      content:
        "Use the search bar to find courses by code (e.g., 'CSCI') or by keywords in the title (e.g., 'programming', 'data'). Results will appear below the bar and individual courses can be dragged into the semesters they're offered in.",
      position: "bottom",
    },
    {
      target: ".sidebar",
      title: "Track Your Progress",
      content:
        "The sidebar shows your concentration requirements and progress. Select your concentration from the dropdown to see specific requirements.",
      position: "right",
      requiresSidebar: true, // Mark this step as requiring the sidebar
    },
    {
      target: ".add-box",
      title: "Semester Planning",
      content:
        "Each column represents a semester. Click'+ Add Semester' to add new semesters. Drag courses between semesters to plan your schedule.",
      position: "left",
    },
    {
      target: ".semester-header, .semester-header-with-select",
      title: "Semester Options",
      content:
        "Click the green section to select a specific semester. Careful! You can't change the title after you select it. But luckily, you can click the menu (⋮) on any semester to add new semesters to the left or right, or delete whole semesters.",
      position: "right",
    },
    {
      target: ".view-and-sort-container",
      title: "View Controls",
      content:
        "Toggle between viewing 2 or 4 semesters at one time. Click 'Sort Semesters' to organize them chronologically.",
      position: "top",
    },
    {
      target: "",
      title: "Course Management",
      content:
        "Drag courses between semesters as your schedule changes. For capstones, check the box inside that course so it counts towards your concentration. A green box means you satisfied all the preprequisites! A red box means you're missing a required course in your schedule",
      position: "center",
      offset: { x: 0, y: 0 },
    },
    {
      target: ".Sign-in-out-container",
      title: "Save Your Progress",
      content:
        "Sign in to save your plan permanently, or work without signing in (saved in browser). Your progress syncs across devices when signed in.",
      position: "bottom",
    },
    {
      target: ".help-icon",
      title: "Need Help?",
      content:
        "Click this button anytime to restart the tour or get help. Happy planning!",
      position: "top",
    },
  ];

  useEffect(() => {
    // Skip positioning for first step since it's always centered
    if (currentStep > 0) {
      updateTargetPosition();
    }

    const handleResize = () => {
      if (currentStep > 0) updateTargetPosition();
    };
    const handleScroll = () => {
      if (currentStep > 0) updateTargetPosition();
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [currentStep]);

  // Function to check if sidebar is collapsed and expand it if needed
  const ensureSidebarExpanded = () => {
    const step = tourSteps[currentStep];

    if (!step.requiresSidebar) return;

    // Check if sidebar is collapsed by looking for the sidebar-collapsed class
    const sidebar = document.querySelector(".sidebar") as HTMLElement;
    if (!sidebar) return;

    const isCollapsed = sidebar.classList.contains("sidebar-collapsed");

    if (isCollapsed) {
      setSidebarWasCollapsed(true);

      // Find the expand button (it's the first button in header-row)
      const expandButton = document.querySelector(
        ".header-row button"
      ) as HTMLElement;
      if (expandButton) {
        console.log("Clicking expand button to open sidebar for tour");
        expandButton.click();
      }
    }
  };

  const updateTargetPosition = () => {
    const step = tourSteps[currentStep];

    // If no target specified (e.g., welcome message), don't highlight anything
    if (!step.target) {
      setTargetRect(null);
      return;
    }

    // Ensure sidebar is expanded if this step requires it
    ensureSidebarExpanded();

    // Wait a moment for sidebar animation to complete
    setTimeout(
      () => {
        const elements = document.querySelectorAll(step.target);

        if (elements.length > 0) {
          // Try to find a visible element
          let targetElement: Element | null = null;

          for (const element of elements) {
            const rect = element.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              targetElement = element;
              break;
            }
          }

          if (targetElement) {
            const rect = targetElement.getBoundingClientRect();
            setTargetRect(rect);

            // Scroll element into view if needed
            if (rect.top < 100 || rect.bottom > window.innerHeight - 100) {
              targetElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          } else {
            // If no specific element found, center the tooltip
            setTargetRect(null);
          }
        } else {
          setTargetRect(null);
        }
      },
      step.requiresSidebar ? 300 : 0
    ); // Wait for sidebar animation if needed
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      // Check if we're currently on the sidebar step and need to restore state before moving to next step
      const currentTourStep = tourSteps[currentStep];
      if (currentTourStep.requiresSidebar && sidebarWasCollapsed) {
        // Close the sidebar before moving to the next step
        const expandButton = document.querySelector(
          ".header-row button"
        ) as HTMLElement;
        if (expandButton) {
          console.log(
            "Leaving sidebar step - restoring sidebar collapsed state"
          );
          expandButton.click();
          setSidebarWasCollapsed(false);

          // Wait for sidebar animation to complete before moving to next step
          setTimeout(() => {
            setCurrentStep(currentStep + 1);
          }, 350); // Wait slightly longer than the 0.3s CSS transition
          return;
        }
      }

      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    // Restore sidebar state when tour is skipped
    if (sidebarWasCollapsed) {
      const expandButton = document.querySelector(
        ".header-row button"
      ) as HTMLElement;
      if (expandButton) {
        console.log("Tour skipped - restoring sidebar collapsed state");
        expandButton.click();
        setSidebarWasCollapsed(false);
      }
    }
    onClose();
  };

  const getTooltipPosition = () => {
    const step = tourSteps[currentStep];
    const position = step.position || "bottom";

    // For center position or no target, immediately center the tooltip
    if (position === "center" || !step.target || !targetRect) {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }

    if (!tooltipRef.current) {
      return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    }

    const offset = step.offset || { x: 0, y: 0 };
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    let top = 0;
    let left = 0;

    switch (position) {
      case "top":
        top = targetRect.top - tooltipRect.height - 20;
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
        break;
      case "bottom":
        top = targetRect.bottom + 20;
        left = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2;
        break;
      case "left":
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        left = targetRect.left - tooltipRect.width - 20;
        break;
      case "right":
        top = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        left = targetRect.right + 20;
        break;
      case "center":
        top = window.innerHeight / 2 - tooltipRect.height / 2;
        left = window.innerWidth / 2 - tooltipRect.width / 2;
        break;
    }

    // Apply offset
    top += offset.y;
    left += offset.x;

    // Keep tooltip within viewport with extra margin for sidebar
    const sidebar = document.querySelector(".sidebar-container");
    const sidebarWidth = sidebar ? sidebar.getBoundingClientRect().width : 0;
    const minLeft =
      position === "right" || position === "center" ? sidebarWidth + 20 : 20;

    top = Math.max(
      20,
      Math.min(top, window.innerHeight - tooltipRect.height - 20)
    );
    left = Math.max(
      minLeft,
      Math.min(left, window.innerWidth - tooltipRect.width - 20)
    );

    return { top: `${top}px`, left: `${left}px` };
  };

  const getSpotlightStyle = () => {
    // Don't create a spotlight cutout for the first step
    if (!targetRect || currentStep === 0) {
      return {};
    }

    return {
      clipPath: `polygon(
        0 0,
        0 100%,
        ${targetRect.left - 5}px 100%,
        ${targetRect.left - 5}px ${targetRect.top - 5}px,
        ${targetRect.right + 5}px ${targetRect.top - 5}px,
        ${targetRect.right + 5}px ${targetRect.bottom + 5}px,
        ${targetRect.left - 5}px ${targetRect.bottom + 5}px,
        ${targetRect.left - 5}px 100%,
        100% 100%,
        100% 0
      )`,
    };
  };

  return (
    <div className="tour-container">
      {/* Dark overlay with spotlight cutout */}
      <div
        className="tour-overlay"
        style={getSpotlightStyle()}
        onClick={skipTour}
      />

      {/* Highlight box around target element (skip for first step) */}
      {targetRect && currentStep > 0 && (
        <div
          className="tour-highlight"
          style={{
            top: `${targetRect.top - 8}px`,
            left: `${targetRect.left - 8}px`,
            width: `${targetRect.width + 10}px`,
            height: `${targetRect.height + 10}px`,
            borderRadius: "8px",
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={`tour-tooltip ${
          currentStep === 0 ? "tour-tooltip-centered" : ""
        }`}
        style={currentStep === 0 ? {} : getTooltipPosition()}
      >
        <button className="tour-close" onClick={skipTour}>
          <X size={20} />
        </button>

        <div className="tour-content">
          <h3>{tourSteps[currentStep].title}</h3>
          <p>{tourSteps[currentStep].content}</p>
        </div>

        <div className="tour-navigation">
          <div className="tour-progress">
            {currentStep + 1} of {tourSteps.length}
          </div>

          <div className="tour-buttons">
            {currentStep > 0 && (
              <button className="tour-btn tour-btn-prev" onClick={prevStep}>
                <ChevronLeft size={16} />
                Back
              </button>
            )}

            <button className="tour-btn tour-btn-skip" onClick={skipTour}>
              Skip Tour
            </button>

            <button className="tour-btn tour-btn-next" onClick={nextStep}>
              {currentStep === tourSteps.length - 1 ? "Finish" : "Next"}
              {currentStep < tourSteps.length - 1 && <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
