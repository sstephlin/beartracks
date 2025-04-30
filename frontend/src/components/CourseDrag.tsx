import React, { useState } from "react";
import "../styles/SemesterBox.css";

interface CourseDragProps {
  id: string;
  courseCode: string;
  courseTitle?: string;
  semesterId: string;
  isEmpty: boolean;
  isEditing?: boolean;
  onDragStart?: (
    e: React.DragEvent,
    course: { courseCode: string; courseTitle: string; semesterId: string }
  ) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onSaveCourse?: (id: string, code: string, title: string) => void;
}

export default function CourseDrag({
  id,
  courseCode,
  courseTitle,
  semesterId,
  isEmpty,
  isEditing = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onSaveCourse,
}: CourseDragProps) {
  const [code, setCode] = useState(courseCode);
  const [title, setTitle] = useState(courseTitle || "");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && onSaveCourse) {
      onSaveCourse(id, code.trim(), title.trim());
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e, {
        courseCode,
        courseTitle: courseTitle || "",
        semesterId,
      });
    }

    e.dataTransfer.setData("courseCode", courseCode);
    e.dataTransfer.setData("courseTitle", courseTitle || "");
    e.dataTransfer.setData("semesterId", semesterId);
  };

  return (
    <div
      className={`course-slot ${isEmpty ? "empty" : "filled"}`}
      draggable={!isEmpty && !isEditing}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
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
        <div className="course-filled">
          <div className="course-code">{courseCode}</div>
          {courseTitle && <div className="course-title">{courseTitle}</div>}
        </div>
      )}
    </div>
  );
}
