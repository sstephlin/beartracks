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
}

export default function GuidedTour({ onClose }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const tourSteps: TourStep[] = [
    {
      target: "",  // No target for welcome message
      title: "Welcome to BearTracks! 🐻",
      content: "Your personal course planner for organizing your academic journey. Let's take a quick tour of the main features.",
      position: "center",
      offset: { x: 0, y: 0 },
    },
    {
      target: ".header-search-container",
      title: "Search for Courses",
      content: "Use the search bar to find courses by code (e.g., 'CSCI') or by keywords in the title (e.g., 'programming', 'data'). Results appear below and can be dragged into semesters.",
      position: "bottom",
    },
    {
      target: ".sidebar-container",
      title: "Track Your Progress",
      content: "The sidebar shows your concentration requirements and progress. Select your concentration from the dropdown to see specific requirements.",
      position: "right",
    },
    {
      target: ".semester-box, .add-semester-box",
      title: "Semester Planning",
      content: "Each box represents a semester. Click '+ Add Semester' to add new semesters. Drag courses between semesters to plan your schedule.",
      position: "top",
    },
    {
      target: ".menu-button",
      title: "Semester Options",
      content: "Click the three-dot menu (⋮) on any semester to rename it, delete it, or add a manual course for transfer credits or special courses.",
      position: "left",
    },
    {
      target: ".view-and-sort-container",
      title: "View Controls",
      content: "Toggle between 2 or 4 semesters per row. Click 'Sort Semesters' to organize them chronologically.",
      position: "top",
    },
    {
      target: ".course-block",
      title: "Course Management",
      content: "Drag courses between semesters or to the trash to remove them. Right-click on 1000+ level courses to set as capstone. Icons show prerequisite status.",
      position: "top",
    },
    {
      target: ".Sign-in-out-container",
      title: "Save Your Progress",
      content: "Sign in to save your plan permanently, or work without signing in (saved in browser). Your progress syncs across devices when signed in.",
      position: "bottom",
    },
    {
      target: ".help-icon",
      title: "Need Help?",
      content: "Click this button anytime to restart the tour or get help. Happy planning! 🎓",
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

  const updateTargetPosition = () => {
    const step = tourSteps[currentStep];
    
    // If no target specified (e.g., welcome message), don't highlight anything
    if (!step.target) {
      setTargetRect(null);
      return;
    }
    
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
          targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } else {
        // If no specific element found, center the tooltip
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
    }
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
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
    const sidebar = document.querySelector('.sidebar-container');
    const sidebarWidth = sidebar ? sidebar.getBoundingClientRect().width : 0;
    const minLeft = position === "right" || position === "center" ? sidebarWidth + 20 : 20;
    
    top = Math.max(20, Math.min(top, window.innerHeight - tooltipRect.height - 20));
    left = Math.max(minLeft, Math.min(left, window.innerWidth - tooltipRect.width - 20));

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
      <div className="tour-overlay" style={getSpotlightStyle()} onClick={skipTour} />
      
      {/* Highlight box around target element (skip for first step) */}
      {targetRect && currentStep > 0 && (
        <div
          className="tour-highlight"
          style={{
            top: `${targetRect.top - 5}px`,
            left: `${targetRect.left - 5}px`,
            width: `${targetRect.width + 10}px`,
            height: `${targetRect.height + 10}px`,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={`tour-tooltip ${currentStep === 0 ? 'tour-tooltip-centered' : ''}`}
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