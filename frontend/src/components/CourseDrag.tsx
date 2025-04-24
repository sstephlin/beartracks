import React from 'react';

interface CourseSlotProps {
  id: string;
  courseCode?: string;
  courseTitle?: string;
  isEmpty?: boolean;
  onDragStart?: (e: React.DragEvent, id: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, id: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

const CourseSlot: React.FC<CourseSlotProps> = ({
  id,
  courseCode,
  courseTitle,
  isEmpty = true,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart && !isEmpty) {
      onDragStart(e, id);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
    if (onDragOver) {
      onDragOver(e);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (onDrop) {
      onDrop(e, id);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (onDragEnd) {
      onDragEnd(e);
    }
  };

  return (
    <div 
      className={`course-slot ${!isEmpty ? 'course-filled' : ''}`}
      draggable={!isEmpty}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd} // Add this line
      data-id={id}
    >
      {!isEmpty && (
        <>
          {courseCode}
          {courseTitle && (
            <>
              <br />
              {courseTitle}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default CourseSlot;