import {
  Menu,
  User,
  Trash2,
  AlignJustify,
  CloudMoonRain,
  Computer,
} from "lucide-react";
import "../styles/Sidebar.css";
import "../styles/App.css";
import { Dispatch, SetStateAction, useState, useRef } from "react";
("react");

interface SidebarProps {
  expanded: boolean;
  setExpanded: Dispatch<SetStateAction<boolean>>;
  degree: string;
  setDegree: Dispatch<SetStateAction<string>>;
}

export default function Sidebar(props: SidebarProps) {
  const dropdownRef = useRef<HTMLSelectElement | null>(null); // Create a reference for dropdown
  const handleDegreeSubmit = () => {
    if (dropdownRef.current) {
      props.setDegree(dropdownRef.current.value);
    }
    console.log(props.degree);
  };

  return (
    <aside
      className={`sidebar ${
        props.expanded ? "sidebar-expanded" : "sidebar-collapsed"
      }`}
    >
      <div className="header-row">
        <button
          className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100"
          onClick={() => props.setExpanded((curr) => !curr)}
        >
          <AlignJustify />
        </button>

        {props.expanded && (
          <div className="logo-title">
            <p className="logo-link" style={{ color: "#d6dadd" }}>
              Concentration Requirements
            </p>
          </div>
        )}
      </div>
      {props.expanded && (
        <div>
          <select
            ref={dropdownRef}
            onChange={handleDegreeSubmit}
            className="concentration-dropdown"
          >
            <option> Select a Concentration </option>
            <option value={"Computer Science Sc.B."}>
              Computer Science Sc.B.
            </option>
            <option value={"Computer Science A.B."}>
              Computer Science A.B.
            </option>
          </select>
        </div>
      )}
    </aside>
  );
}
