import { useState } from "react";
import { Menu, User, Trash2, AlignJustify, CloudMoonRain } from "lucide-react";
import "../styles/Sidebar.css";
import "../styles/App.css";
import { Dispatch, SetStateAction } from "react";

interface SidebarProps {
  expanded: boolean;
  setExpanded: Dispatch<SetStateAction<boolean>>;
}

export default function Sidebar(props: SidebarProps) {
  // const [expanded, setExpanded] = useState(true);
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

        <div className={`logo-title ${props.expanded ? "" : "collapsed"}`}>
          <p className="logo-link" style={{ color: "#213333" }}>
            Concentration Requirements
          </p>
        </div>
      </div>
    </aside>
  );
}
