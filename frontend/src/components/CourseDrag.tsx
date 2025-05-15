import React, { useEffect, useState } from "react";
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
  isManual?: boolean;

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
  isManual = false,
}: CourseDragProps & { isCapstone?: boolean }) {
  const [code, setCode] = useState(courseCode);
  const [title, setTitle] = useState(courseTitle || "");
  const [isChecked, setIsChecked] = useState<boolean>(!!isCapstone);

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
      draggable={!isEmpty && !isEditing}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
    >
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
        </div>
      )}
    </div>
  );
}
