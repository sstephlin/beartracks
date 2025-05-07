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
import { Dispatch, SetStateAction, useState, useRef, useEffect } from "react";
("react");
import { useUser } from "@clerk/clerk-react";

interface SidebarProps {
  expanded: boolean;
  setExpanded: Dispatch<SetStateAction<boolean>>;
  degree: string;
  setDegree: Dispatch<SetStateAction<string>>;
}

export default function Sidebar(props: SidebarProps) {
  const { user } = useUser();
  const uid = user?.id;
  const dropdownRef = useRef<HTMLSelectElement | null>(null); // Create a reference for dropdown
  const handleDegreeSubmit = () => {
    if (dropdownRef.current) {
      props.setDegree(dropdownRef.current.value);
    }
    fetch(
      `http://localhost:3232/store-concentration-requirement?uid=${uid}&concentration=${props.degree}`
    )
      .then((response) => response.json())
      .then((json) => {
        console.log(json.result);
        if (json.result === "success") {
          props.setErrorMessage(null);
          // props.setBroadbandData(json.responseMap["broadband percentage"]);
          props.setMatchingRows([
            ["dateTime", "county", "state", "broadband percentage"],
            [
              json.responseMap["dateTime"],
              county,
              state,
              json.responseMap["broadband percentage"],
            ],
          ]);
        } else {
          props.setErrorMessage(json.result);
        }
      });
    console.log(props.degree);
  };
  //set concentration for this user

  // get concentration requirements for this user
  useEffect(() => {
    console.log("effect");
    const fetchData = async () => {
      if (!user?.id) {
        console.log("no user id");
        return;
      }
      try {
        const response = await fetch(
          `http://localhost:3232/check-concentration-requirements?uid=${user.id}`
        );
        const data = await response.json();
        const semestersData = data.requirements_options;

        console.log("data", data);
        console.log("requirements", semestersData);
      } catch (err) {
        console.error("Fetch failed:", err);
      }
    };
    fetchData();
  }, [user?.id]);

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
