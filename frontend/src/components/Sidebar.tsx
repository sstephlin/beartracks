import { AlignJustify } from "lucide-react";
import "../styles/Sidebar.css";
import "../styles/App.css";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
/**
 * This component addresses the sidebar functionality, displaying and
 * updating concentration requirement information using the data in the
 * user's current planner
 */
interface SidebarProps {
  expanded: boolean;
  setExpanded: Dispatch<SetStateAction<boolean>>;
  degree: string;
  setDegree: Dispatch<SetStateAction<string>>;
  refreshSidebar: boolean;
  numCompleted: number;
  numRequired: number;
  setNumCompleted: Dispatch<SetStateAction<number>>;
  setNumRequired: Dispatch<SetStateAction<number>>;
}

export default function Sidebar(props: SidebarProps) {
  const { user } = useUser();
  const uid = user?.id;
  const [selectedDegree, setSelectedDegree] = useState<string>("");
  const [degreeInfo, setDegreeInfo] = useState<Record<string, string[]>>({});
  const [courseInfo, setCourseInfo] = useState<Record<string, string[]>>({});
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(false);

  // fetch and Load stored degree, done at very beginning and changes when user id changes
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
  }, [user?.id]); // Fetch and display requirements for a selected concentration

  // this useEffect calls displayConcentrationRequiements when page is first rendered or when the  refresh sidebar prop changes
  useEffect(() => {
    console.log("effecting");
    if (selectedDegree) {
      displayConcentrationRequirements(selectedDegree);
    }
  }, [props.refreshSidebar]);

  // this function dislpays the concentration requirements of the user's stored concentration
  const displayConcentrationRequirements = async (degree: string) => {
    if (!user?.id || !degree) return;
    setLoading(true);
    try {
      // get concen reqs from backend
      const response = await fetch(
        `http://localhost:3232/get-concen-reqs?uid=${user.id}`
      );
      const data = await response.json();
      setDegreeInfo(data.requirements_options); // gets info about what courses user has taken and satisfies reqs
      console.log("Requirements for", degree, data.requirements_options);
    } catch (err) {
      console.error("Failed to fetch requirements:", err);
    }
    try {
      // calculate how many courses satisfy, displayed in progress bar and message
      const response = await fetch(
        `http://localhost:3232/check-concentration-requirements?uid=${user.id}`
      );
      const data = await response.json();
      setCourseInfo(data.user_requirements_breakdown);
      props.setNumCompleted(data.courses_completed);
      if (degree === "Computer Science A.B.") {
        props.setNumRequired(10);
      } else if (degree === "Computer Science Sc.B.") {
        props.setNumRequired(16);
      }
      console.log("Breakdown for", user.id, data.user_requirements_breakdown);
    } catch (err) {
      console.error("Failed to fetch requirements:", err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle expansion of sidebar
  const handleExpand = (key: string) => {
    setExpandedKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    console.log("key", key);
  };

  // string to bool function to convert json response to frontend variable value
  function stringToBool(str: string): boolean {
    return str.toLowerCase() === "true";
  }

  // get the last stored value for the expanded variable
  useEffect(() => {
    const getExpanded = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(
          `http://localhost:3232/get-expanded?uid=${user.id}`
        );
        const data = await res.json();
        if (data.expanded) {
          props.setExpanded(stringToBool(data.expanded));
        }
      } catch (err) {
        console.error("failed to fetch expanded", err);
      }
    };
    getExpanded();
  }, [user?.id]);

  // sets the expanded variable and stores in backend
  async function handleExpanded(stringValue: string) {
    await fetch(
      `http://localhost:3232/store-expanded?uid=${uid}&expanded=${stringValue}`,
      {
        method: "POST",
      }
    );
    props.setExpanded(!props.expanded);
  }

  // function that handles changing degree from the dropdown menu
  async function handleChangeDegree(e: React.ChangeEvent<HTMLSelectElement>) {
    const newDegree = e.target.value;
    setSelectedDegree(newDegree);
    props.setDegree(newDegree);
    try {
      await fetch(
        `http://localhost:3232/store-concentration?uid=${uid}&concentration=${newDegree}`,
        { method: "POST" }
      );
      console.log("Stored concentration");
      displayConcentrationRequirements(newDegree);
    } catch (err) {
      console.error("Network error while storing concentration:", err);
    }
  }

  return (
    <aside
      className={`sidebar ${
        props.expanded ? "sidebar-expanded" : "sidebar-collapsed"
      }`}
    >
      <div className="header-row">
        <button
          className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100"
          onClick={() => handleExpanded((!props.expanded).toString())}
        >
          <AlignJustify />
        </button>
        {props.expanded && (
          <div className="logo-title">
            <p
              className="concentration-title"
              style={{ color: "#d6dadd", fontSize: "1.5rem" }}
            >
              Concentration Requirements
            </p>
          </div>
        )}
      </div>
      {props.expanded && (
        <div>
          <select
            value={selectedDegree}
            onChange={(e) => handleChangeDegree(e)}
            className="concentration-dropdown"
          >
            <option value="">Select a Concentration</option>
            <option value="Computer Science Sc.B.">
              Computer Science Sc.B.
            </option>
            <option value="Computer Science A.B.">Computer Science A.B.</option>
          </select>

          <div className="progress-check">
            {loading ? (
              <h3>Loading your progress...</h3>
            ) : (
              <h3>
                {props.numCompleted} out of {props.numRequired} courses
                completed!
              </h3>
            )}
          </div>

          <div className="concentration-req-container">
            {props.degree !== "Undeclared" &&
              !loading &&
              Object.keys(degreeInfo).map((key) => {
                const isExpanded = expandedKeys[key];
                return (
                  <div key={key} className="concentration-category">
                    <div className="concentration-row">
                      {!isExpanded ? (
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
                      ) : (
                        <button
                          onClick={() => handleExpand(key)}
                          className="expand-button"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="m4.5 15.75 7.5-7.5 7.5 7.5"
                            />
                          </svg>
                        </button>
                      )}
                      {key}
                    </div>

                    <div className="requirement-list-container">
                      {isExpanded && (
                        <div>
                          <ul className="requirement-list">
                            {loading ? (
                              <li>Loading Courses...</li>
                            ) : degreeInfo[key]?.length === 0 ? (
                              <p className="cannot-list">
                                Sorry! Cannot list courses at the moment
                              </p>
                            ) : (
                              degreeInfo[key].map((course) => (
                                <li
                                  key={course}
                                  className={`${
                                    (courseInfo[key] || []).includes(course)
                                      ? "requirement_completed"
                                      : "requirement_not_completed"
                                  }`}
                                >
                                  {course}
                                </li>
                              ))
                            )}
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
