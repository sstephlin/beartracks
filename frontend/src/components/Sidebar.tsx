import { AlignJustify } from "lucide-react";
import "../styles/Sidebar.css";
import "../styles/App.css";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
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
  const [selectedDegree, setSelectedDegree] = useState<string>("");
  const [degreeInfo, setDegreeInfo] = useState<Record<string, string[]>>({});
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  // Load stored degree on mount
  useEffect(() => {
    const fetchConcentration = async () => {
      if (!user?.id) return;
      try {
        const response = await fetch(
          `http://localhost:3232/get-concentration?uid=${user.id}`
        );
        const data = await response.json();
        if (data.concentration) {
          setSelectedDegree(data.concentration);
          props.setDegree(data.concentration);
          displayConcentrationRequirements(data.concentration);
          console.log("user concentration from fetch", data.concentration);
        }
      } catch (err) {
        console.error("Error fetching user concentration", err);
      }
    };
    fetchConcentration();
  }, [user?.id]);

  // Fetch requirements from backend
  const displayConcentrationRequirements = async (degree: string) => {
    if (!user?.id || !degree) return;
    try {
      const response = await fetch(
        `http://localhost:3232/get-concen-reqs?uid=${user.id}`
      );
      const data = await response.json();
      setDegreeInfo(data.requirements_options);
      console.log("Requirements for", degree, data);
    } catch (err) {
      console.error("Failed to fetch requirements:", err);
    }
  };

  // Toggle expansion per key
  const handleExpand = (key: string) => {
    setExpandedKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    console.log("key", key);
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
            value={selectedDegree}
            onChange={(e) => {
              const newDegree = e.target.value;
              setSelectedDegree(newDegree);
              props.setDegree(newDegree);

              fetch(
                `http://localhost:3232/store-concentration?uid=${uid}&concentration=${newDegree}`,
                { method: "POST" }
              )
                .then(() => {
                  console.log("Stored concentration");
                  displayConcentrationRequirements(newDegree);
                })
                .catch((err) =>
                  console.error(
                    "Network error while storing concentration:",
                    err
                  )
                );
            }}
            className="concentration-dropdown"
          >
            <option value="">Select a Concentration</option>
            <option value="Computer Science Sc.B.">
              Computer Science Sc.B.
            </option>
            <option value="Computer Science A.B.">Computer Science A.B.</option>
          </select>

          <div className="concentration-req-container">
            {props.degree !== "Undeclared" &&
              Object.keys(degreeInfo)
                .reverse()
                .map((key) => {
                  const isExpanded = expandedKeys[key];
                  return (
                    <div key={key} className="concentration-category">
                      <div className="concentration-row">
                        <button
                          onClick={() => handleExpand(key)}
                          className="expand-button"
                        >
                          <svg
                            className={`button-icon ${
                              isExpanded ? "rotated" : ""
                            }`}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="white"
                            width="24"
                            height="24"
                            style={{ display: "block" }}
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 14a1 1 0 01-.707-.293l-5-5a1 1 0 011.414-1.414L10 11.586l4.293-4.293a1 1 0 011.414 1.414l-5 5A1 1 0 0110 14z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        {key}
                      </div>

                      <div className="requirement-list-container">
                        {isExpanded && (
                          <div>
                            <ul className="requirement-list">
                              {(degreeInfo[key] || []).map((course) => (
                                <li key={course} className="text-white pl-6">
                                  {course}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      )}
    </aside>
  );
}
