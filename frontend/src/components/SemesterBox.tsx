// import React from "react";
// import RightClick from "./RightClick";
// import "../styles/SemesterBox.css";

// interface SemesterBoxProps {
//   boxId: string;
//   selectedSemester: string;
//   availableSemesters: string[];
//   onSemesterSelect: (boxId: string, semester: string) => void;
//   expanded: boolean;
//   children?: React.ReactNode;
//   onDragOver?: (e: React.DragEvent) => void;
//   onDrop?: (e: React.DragEvent) => void;
//   onRightClick?: (
//     e: React.MouseEvent<HTMLDivElement, MouseEvent>,
//     boxId: string
//   ) => void; // Accept boxId as part of the event handler
// }

// const SemesterBox: React.FC<SemesterBoxProps> = ({
//   boxId,
//   selectedSemester,
//   availableSemesters,
//   onSemesterSelect,
//   expanded,
//   children,
//   onDragOver,
//   onDrop,
//   onRightClick,
// }) => {
//   const handleDragOver = (e: React.DragEvent) => {
//     e.preventDefault();
//     onDragOver?.(e);
//   };

//   const handleDrop = (e: React.DragEvent) => {
//     e.preventDefault();
//     onDrop?.(e);
//   };

//   const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const value = e.target.value;
//     if (value) {
//       onSemesterSelect(boxId, value);
//     }
//   };

//   // Trigger the passed down onRightClick function with boxId
//   const handleRightClickEvent = (
//     e: React.MouseEvent<HTMLDivElement, MouseEvent>
//   ) => {
//     if (onRightClick) {
//       onRightClick(e, boxId); // Pass boxId to identify which box was clicked
//     }
//   };

//   return (
//     <div
//       className={`semester-box ${expanded ? "expanded" : "collapsed"}`}
//       onDragOver={handleDragOver}
//       onDrop={handleDrop}
//       onContextMenu={handleRightClickEvent} // Trigger the right-click event handler
//     >
//       {selectedSemester ? (
//         <div className="semester-header">{selectedSemester}</div>
//       ) : (
//         <select
//           className="semester-select-full"
//           defaultValue=""
//           onChange={handleSelectChange}
//         >
//           <option value="" disabled>
//             Select a semester
//           </option>
//           {availableSemesters.map((sem) => (
//             <option key={sem} value={sem}>
//               {sem}
//             </option>
//           ))}
//         </select>
//       )}
//       <div className="semester-content">{children}</div>
//     </div>
//   );
// };

// export default SemesterBox;

import React from "react";
import RightClick from "./RightClick";
import "../styles/SemesterBox.css";

interface SemesterBoxProps {
  boxId: string;
  selectedSemester: string;
  availableSemesters: string[];
  onSemesterSelect: (boxId: string, semester: string) => void;
  expanded: boolean;
  children?: React.ReactNode;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onRightClick?: (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    boxId: string
  ) => void; // Accept boxId as part of the event handler
}

const SemesterBox: React.FC<SemesterBoxProps> = ({
  boxId,
  selectedSemester,
  availableSemesters,
  onSemesterSelect,
  expanded,
  children,
  onDragOver,
  onDrop,
  onRightClick,
}) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    onDragOver?.(e);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop?.(e);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value) {
      onSemesterSelect(boxId, value);
    }
  };

  // Trigger the passed down onRightClick function with boxId
  const handleRightClickEvent = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    if (onRightClick) {
      onRightClick(e, boxId); // Pass boxId to identify which box was clicked
    }
  };

  return (
    <div
      className={`semester-box ${expanded ? "expanded" : "collapsed"}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onContextMenu={handleRightClickEvent} // Trigger the right-click event handler
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
      <div className="semester-content">{children}</div>
    </div>
  );
};

export default SemesterBox;
