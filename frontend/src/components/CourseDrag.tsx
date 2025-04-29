import React from "react";

interface CourseSlotProps {
  id: string;
  courseCode: string;
  courseTitle?: string;
  isEmpty: boolean;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export default function CourseSlot({
  id,
  courseCode,
  courseTitle,
  isEmpty,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: CourseSlotProps) {
  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e, id);
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
        <>
          {courseCode}
          {courseTitle && <div className="course-title">{courseTitle}</div>}
        </>
      )}
    </div>
  );
}
