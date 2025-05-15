import React, { forwardRef } from "react";
import "../styles/SemesterBox.css";

// this is the props interface for SemesterBox
interface SemesterBoxProps {
  boxId: string;
  selectedSemester: string;
  availableSemesters: string[];
  onSemesterSelect: (boxId: string, semester: string) => void;
  expanded: boolean;
  children?: React.ReactNode;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent) => void;
  onRightClick?: (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    boxId: string
  ) => void;
  errorMessage?: string | null;
}

const SemesterBox = forwardRef<HTMLDivElement, SemesterBoxProps>(
  (
    {
      boxId,
      selectedSemester,
      availableSemesters,
      onSemesterSelect,
      expanded,
      children,
      onDragOver,
      onDragLeave,
      onDrop,
      onRightClick,
      errorMessage,
    },
    ref
  ) => {
    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      onDragOver?.(e);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      onDrop?.(e);
    };

    // this handles selecting a semester from the dropdown
    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (value) {
        onSemesterSelect(boxId, value);
      }
    };

    // this is the right-click logic for opening a menu
    const handleRightClickEvent = (
      e: React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      onRightClick?.(e, boxId);
    };

    return (
      <div
        ref={ref}
        className={`semester-box ${expanded ? "expanded" : "collapsed"} ${
          errorMessage ? "error" : ""
        }`}
        onDragOver={handleDragOver}
        onDragLeave={onDragLeave}
        onDrop={handleDrop}
        onContextMenu={handleRightClickEvent}
      >
        {selectedSemester ? (
          <div className="semester-header">{selectedSemester}</div>
        ) : (
          <select
            className="semester-select-full"
            defaultValue=""
            onChange={handleSelectChange}
          >
            <option value="" disabled>
              Select a semester
            </option>
            {availableSemesters.map((sem) => (
              <option key={sem} value={sem}>
                {sem}
              </option>
            ))}
          </select>
        )}
        {errorMessage && (
          <div className="semester-error-message">{errorMessage}</div>
        )}
        <div className="semester-content">{children}</div>
      </div>
    );
  }
);

export default SemesterBox;
