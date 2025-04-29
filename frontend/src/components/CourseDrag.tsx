import React from "react";
import "../styles/SemesterBox.css";

interface CourseDragProps {
  id: string;
  courseCode: string;
  courseTitle?: string;
  semesterId: string;
  isEmpty: boolean;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export default function CourseDrag({
  id,
  courseCode,
  courseTitle,
  isEmpty,
  semesterId,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: CourseDragProps) {
  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e, id);

      // 🧹 Add these lines:
      e.dataTransfer.setData("courseId", id); // course unique id
      e.dataTransfer.setData("semesterId", semesterId); // semester name like "Fall 23"
      e.dataTransfer.setData("courseCode", courseCode); // course code like CSCI 1230
      e.dataTransfer.setData("courseTitle", courseTitle || ""); // optional title
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (onDragEnd) {
      onDragEnd(e);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (onDragOver) {
      onDragOver(e);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (onDrop) {
      onDrop(e);
    }
  };

  return (
    <div
      className={`course-slot ${isEmpty ? "empty" : "filled"}`}
      draggable={!isEmpty}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {!isEmpty && (
        <div className="course-filled">
          <div className="course-code">{courseCode}</div>
          {courseTitle && <div className="course-title">{courseTitle}</div>}
        </div>
      )}
    </div>
  );
}
