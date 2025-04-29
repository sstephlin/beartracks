import React from "react";
import "../styles/SemesterBox.css";

interface SemesterBoxProps {
  title: string;
  children?: React.ReactNode;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

const SemesterBox: React.FC<SemesterBoxProps> = ({
  title,
  children,
  onDragOver,
  onDrop,
}) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (onDragOver) {
      onDragOver(e);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (onDrop) {
      onDrop(e);
    }
  };

  return (
    <div
      className="semester-box"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="semester-header">{title}</div>
      <div className="semester-content">{children}</div>
    </div>
  );
};

export default SemesterBox;
