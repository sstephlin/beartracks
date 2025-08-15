import React, { useEffect, useState, useRef } from "react";
import "../styles/SemesterBox.css";

// these are all the props for the CourseDrag component
interface CourseDragProps {
  id: string;
  courseCode: string;
  courseTitle?: string;
  semesterId: string;
  isEmpty: boolean;
  isEditing?: boolean;
  prereqsMet: boolean;
  isCapstone: boolean;
  showCapstoneCheckbox?: boolean;
  onDeleteCourse?: (
    courseId: string,
    courseCode: string,
    courseTitle: string,
    semesterId: string
  ) => void;
  onDeleteManualCourse?: (courseId: string) => void;
  isManual?: boolean;
  userId?: string; // Add userId prop for prerequisite fetching

  onDragStart?: (
    e: React.DragEvent,
    course: { courseCode: string; title: string; semesterId: string }
  ) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onSaveCourse?: (id: string, code: string, title: string) => void;
  onToggleCapstone?: (id: string, newValue: boolean) => void;
}

interface PrerequisiteData {
  type: string;
  courseCode?: string;
  isConcurrent?: boolean;
  isCompleted?: boolean;
  completedInSemester?: string;
  satisfied: boolean;
  children?: PrerequisiteData[];
}

// Updated interface to match your backend response
interface PrerequisiteResponse {
  hasPrereqs: boolean;
  prerequisiteTree?: PrerequisiteData;
  message?: string;
  displayText?: string; // Add this new property
  overallStatus?: string; // Add this new property
  summary?: string; // Add this new property
}

export default function CourseDrag({
  id,
  courseCode,
  courseTitle,
  semesterId,
  isEmpty,
  isEditing = false,
  isCapstone,
  prereqsMet,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onSaveCourse,
  onToggleCapstone,
  showCapstoneCheckbox,
  onDeleteCourse,
  onDeleteManualCourse,
  isManual = false,
  userId,
}: CourseDragProps & { isCapstone?: boolean }) {
  const [code, setCode] = useState(courseCode);
  const [title, setTitle] = useState(courseTitle || "");
  const [isChecked, setIsChecked] = useState<boolean>(!!isCapstone);
  const [showPrereqPopup, setShowPrereqPopup] = useState(false);
  // Updated state type to use the new interface
  const [prerequisiteData, setPrerequisiteData] =
    useState<PrerequisiteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  // this handles enter key press to save course
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && onSaveCourse) {
      onSaveCourse(id, code.trim(), title.trim());
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e, {
        courseCode,
        title: title || "",
        semesterId,
      });
    }

    e.dataTransfer.setData("courseCode", courseCode);
    e.dataTransfer.setData("title", title || "");
    e.dataTransfer.setData("semesterId", semesterId);
  };

  // Replace your handlePrereqClick function with this version:
  const handlePrereqClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (showPrereqPopup) {
      setShowPrereqPopup(false);
      return;
    }

    if (!userId) {
      console.error("User ID is required to fetch prerequisites");
      return;
    }

    // Get both button position and mouse position for debugging
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    // Debug logging
    console.log("Button rect:", rect);
    console.log("Mouse position:", { x: mouseX, y: mouseY });
    console.log("Viewport:", {
      width: window.innerWidth,
      height: window.innerHeight,
    });

    // Popup dimensions
    const popupWidth = 450;
    const popupHeight = 300;

    // Simple approach: position popup relative to the button, not mouse
    // This is more predictable than mouse position
    let left = rect.left;
    let top = rect.bottom + 5; // 5px below button

    // Adjust if popup goes off right edge
    if (left + popupWidth > window.innerWidth) {
      left = rect.right - popupWidth; // Align right edge of popup with right edge of button
    }

    // Adjust if popup goes off left edge
    if (left < 10) {
      left = 10;
    }

    // Adjust if popup goes off bottom edge
    if (top + popupHeight > window.innerHeight) {
      // Try positioning above the button
      const topAbove = rect.top - popupHeight - 5;
      if (topAbove >= 10) {
        top = topAbove;
      } else {
        // If neither works, position it in the middle of the viewport
        top = (window.innerHeight - popupHeight) / 2;
        left = (window.innerWidth - popupWidth) / 2;
      }
    }

    console.log("Final popup position:", { top, left });
    setPopupPosition({ top, left });

    setLoading(true);
    const [term, year] = semesterId.split(" ");
    const url = `${
      import.meta.env.VITE_BACKEND_URL
    }/get-prereqs?uid=${userId}&code=${encodeURIComponent(
      courseCode
    )}&term=${term}&year=${year}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        console.error("HTTP error:", response.status, response.statusText);
        setLoading(false);
        return;
      }

      const responseText = await response.text();

      if (!responseText.trim()) {
        console.error("Empty response received");
        setLoading(false);
        return;
      }

      let data;
      try {
        data = JSON.parse(responseText.trim());
      } catch (parseError) {
        console.error("Failed to parse JSON:", parseError);
        setLoading(false);
        return;
      }

      if (data.response_type === "success") {
        setPrerequisiteData(data);
        setShowPrereqPopup(true);
      } else {
        console.error("Failed to fetch prerequisites:", data.error);
      }
    } catch (err) {
      console.error("Error fetching prerequisites:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const handleScroll = () => {
      if (showPrereqPopup) {
        setShowPrereqPopup(false);
      }
    };

    if (showPrereqPopup) {
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [showPrereqPopup]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setShowPrereqPopup(false);
      }
    };

    if (showPrereqPopup) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showPrereqPopup]);
  // Replace your renderPrereqTreeBoxes function with this condensed version:

  const renderPrereqTreeBoxes = (
    node: PrerequisiteData,
    depth: number = 0
  ): React.ReactNode => {
    if (node.type === "course") {
      return (
        <span
          className={`prereq-course-chip ${
            node.satisfied ? "satisfied" : "not-satisfied"
          }`}
          style={{
            backgroundColor: node.satisfied ? "#d1f2d1" : "#f8d0d0",
            border: `1px solid ${node.satisfied ? "#28a745" : "#dc3545"}`,
            borderRadius: "16px",
            padding: "2px 4px",
            margin: "0px",
            display: "inline-block",
            fontSize: "11px",
            fontWeight: "600",
            color: node.satisfied ? "#155724" : "#721c24",
            whiteSpace: "nowrap",
          }}
        >
          <span className="course-code">{node.courseCode}</span>
          {node.isConcurrent && (
            <span
              style={{
                fontSize: "9px",
                fontStyle: "italic",
              }}
            >
              (conc)
            </span>
          )}
          <span style={{ fontSize: "9px" }}></span>
        </span>
      );
    }

    const isOrGroup = node.type === "or";

    // Skip the outermost AND group (depth 0) and just render its children directly
    if (depth === 0 && node.type === "and") {
      return (
        <div
          className="prereq-root-children"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
            alignItems: "center",
          }}
        >
          {node.children?.map((child, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <span
                  className="connector-compact"
                  style={{
                    fontSize: "9px",
                    fontWeight: "bold",
                    color: "#6c757d",
                    padding: "2px 4px",
                    backgroundColor: "#f1f3f4",
                    borderRadius: "3px",
                    margin: "0 2px",
                  }}
                >
                  AND
                </span>
              )}
              {renderPrereqTreeBoxes(child, depth + 1)}
            </React.Fragment>
          ))}
        </div>
      );
    }

    return (
      <div
        className={`prereq-group-compact ${node.type}-group`}
        style={{
          border: `1px solid ${node.satisfied ? "#28a745" : "#dc3545"}`,
          borderRadius: "6px",
          padding: "6px 8px",
          margin: "3px 0",
          backgroundColor: node.satisfied ? "#f8fff9" : "#fff8f8",
          display: "inline-block",
          maxWidth: "100%",
        }}
      >
        <div
          className="group-header-compact"
          style={{
            fontSize: "10px",
            fontWeight: "bold",
            color: node.satisfied ? "#155724" : "#721c24",
            marginBottom: "4px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            justifyContent: "flex-start",
          }}
        >
          <span>{isOrGroup ? " ONE OF:" : "ALL:"}</span>
          <span style={{ fontSize: "12px" }}>{node.satisfied ? "✓" : "✗"}</span>
        </div>

        <div
          className="group-children-compact"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
            alignItems: "center",
          }}
        >
          {node.children?.map((child, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <span
                  className="connector-compact"
                  style={{
                    fontSize: "9px",
                    fontWeight: "bold",
                    color: "#6c757d",
                    padding: "2px 4px",
                    backgroundColor: "#f1f3f4",
                    borderRadius: "3px",
                    margin: "0 2px",
                  }}
                >
                  {isOrGroup ? "OR" : "&"}
                </span>
              )}
              {renderPrereqTreeBoxes(child, depth + 1)}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // Handle delete button click for regular courses (with confirmation)
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onDeleteCourse) {
      onDeleteCourse(id, courseCode, courseTitle || "", semesterId);
    }
  };

  // NEW: Handle delete button click for manual courses (immediate deletion)
  const handleManualDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onDeleteManualCourse) {
      onDeleteManualCourse(id);
    }
  };

  // this ensures to keep thecapstone checkbox state in sync with props
  useEffect(() => {
    setIsChecked(isCapstone);
  }, [isCapstone]);

  return (
    <div
      className={`
        course-slot 
        ${isEmpty ? "empty" : "filled"} 
        ${!isEmpty ? (prereqsMet ? "pr-met" : "pr-not-met") : ""}
        ${isCapstone ? "capstone" : ""}
        ${isManual ? "manual-course" : "search-course"}
      `}
      draggable={!isEmpty}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
    >
      {/* Delete button - different logic for manual vs regular courses */}
      {!isEmpty && (
        <>
          {isManual && onDeleteManualCourse ? (
            // X button for manual courses (immediate deletion)
            <button
              className="delete-manual-course-btn"
              onClick={handleManualDeleteClick}
              aria-label={`Delete manual course ${courseCode}`}
              title={`Delete ${courseCode} (manual course)`}
              style={{
                position: "absolute",
                top: "4px",
                right: "4px",
                background: "None",
                color: "black",
                width: "18px",
                height: "18px",
                fontSize: "16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          ) : (
            // Regular delete button for backend courses (with confirmation)
            onDeleteCourse && (
              <button
                className="delete-course-btn"
                onClick={handleDeleteClick}
                aria-label={`Delete ${courseCode}`}
                title={`Delete ${courseCode}`}
              >
                ×
              </button>
            )
          )}
        </>
      )}

      {!isEmpty && isEditing ? (
        <div className="course-edit-fields">
          <input
            type="text"
            placeholder="Course Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <input
            type="text"
            placeholder="Course Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
      ) : (
        // this is the standard display mode
        <div className="course-filled">
          <div className="course-header">
            <div className="course-code">{courseCode}</div>
            {showCapstoneCheckbox && (
              <input
                type="checkbox"
                className="capstone-checkbox"
                title="Capstone Course"
                checked={isChecked}
                onChange={(e) => {
                  setIsChecked(e.target.checked);
                  onToggleCapstone?.(id, e.target.checked);
                }}
              />
            )}
          </div>
          {title && <div className="course-title">{title}</div>}

          {/* Prerequisites link - only show for non-manual courses */}
          {!isManual && (
            <div className="prereq-section">
              <button
                className="prereq-link"
                onClick={handlePrereqClick}
                disabled={loading}
              >
                {loading ? "Loading..." : "Prerequisites"}
              </button>

              {/* Prerequisites popup - Updated with box layout */}
              {showPrereqPopup && prerequisiteData && (
                <div
                  className="prereq-popup"
                  ref={popupRef}
                  style={{
                    position: "fixed",
                    top: `${popupPosition.top}px`,
                    left: `${popupPosition.left}px`,
                    backgroundColor: "white",
                    border: "2px solid #ccc",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    zIndex: 10000,
                    width: "450px", // Fixed width instead of maxWidth
                    maxHeight: "300px",
                    overflow: "auto",
                    fontSize: "16px",
                    // Add these to ensure proper rendering
                    pointerEvents: "auto",
                    visibility: "visible",
                    opacity: 1,
                  }}
                >
                  <div
                    className="prereq-popup-header"
                    style={{
                      padding: "6px 9px",
                      borderBottom: "1px solid #ddd",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: "#f8f9fa",
                    }}
                  >
                    <h4 style={{ margin: 0, fontSize: "14px" }}>
                      Prerequisites for {courseCode}
                    </h4>
                    <button
                      className="close-popup-btn"
                      onClick={() => setShowPrereqPopup(false)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "16px",
                        cursor: "pointer",
                        padding: "0 4px",
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div
                    className="prereq-popup-content"
                    style={{
                      padding: "6px 9px",
                      margin: "0px",
                      lineHeight: "1",
                    }}
                  >
                    {prerequisiteData.hasPrereqs ? (
                      <div className="prereq-tree">
                        {prerequisiteData.prerequisiteTree &&
                          renderPrereqTreeBoxes(
                            prerequisiteData.prerequisiteTree
                          )}
                      </div>
                    ) : (
                      <div
                        className="no-prereqs"
                        style={{
                          textAlign: "center",
                          padding: "8px",
                          backgroundColor: "#d4edda",
                          border: "1px solid #28a745",
                          borderRadius: "6px",
                          color: "#155724",
                          fontSize: "14px",
                        }}
                      >
                        {prerequisiteData.displayText ||
                          prerequisiteData.message}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
