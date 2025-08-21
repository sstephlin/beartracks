import { AlignJustify } from "lucide-react";
import "../styles/Sidebar.css";
import "../styles/App.css";
import { Dispatch, SetStateAction, useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { sessionStorageUtils } from "../utils/sessionStorageUtils";
import { concentrationUtils } from "../utils/concentrationUtils";

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
  currentCapstoneCourse?: string;
}

export default function Sidebar(props: SidebarProps) {
  const { user } = useUser();
  const uid = user?.id;
  const [selectedDegree, setSelectedDegree] = useState<string>("");
  const [degreeInfo, setDegreeInfo] = useState<Record<string, any>>({});
  const [courseInfo, setCourseInfo] = useState<Record<string, string[]>>({});
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(false);
  
  const [capstoneEligibleCourses, setCapstoneEligibleCourses] = useState<string[]>([]);
  
  const [nestedRequirements, setNestedRequirements] = useState<any[]>([]);

  // fetch capstone data
  const fetchCapstoneData = useCallback(async () => {
    if (!user?.id || !selectedDegree || selectedDegree === "Select a Concentration" || selectedDegree.trim() === "") {
      setCapstoneEligibleCourses([]);
      return;
    }
    
    try {
      const encodedConcentration = encodeURIComponent(selectedDegree);
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/check-capstones?uid=${user.id}&concentration=${encodedConcentration}`
      );
      const data = await response.json();

      if (data.response_type === "success") {
        setCapstoneEligibleCourses(data.user_capstone_eligible_courses || []);
        console.log("Capstone data fetched:", {
          eligible: data.user_capstone_eligible_courses,
        });
      } else {
        console.error("Error fetching capstone data:", data.error);
        setCapstoneEligibleCourses([]);
      }
    } catch (error) {
      console.error("Failed to fetch capstone data:", error);
      setCapstoneEligibleCourses([]);
    }
  }, [user?.id, selectedDegree]);


  // this function dislpays the concentration requirements of the user's stored concentration
  const displayConcentrationRequirements = useCallback(async (degree: string) => {
    if (!degree || degree === "Select a Concentration" || degree.trim() === "") {
      console.log("Skipping requirement display: Invalid concentration.", { concentrationValue: degree });
      setLoading(false); 
      setDegreeInfo({}); 
      setCourseInfo({}); 
      props.setNumCompleted(0);
      props.setNumRequired(0);
      return;
    }
    
    // Handle unsigned users locally
    if (!user?.id) {
      setLoading(true);
      
      const requirements = concentrationUtils.getRequirements(degree);
      setDegreeInfo(requirements.requirements_options);
      
      const sessionData = sessionStorageUtils.getSessionData();
      const userCourses = sessionData?.courses || [];
      
      const requirementCheck = concentrationUtils.checkRequirements(userCourses, degree);
      setCourseInfo(requirementCheck.user_requirements_breakdown);
      props.setNumCompleted(requirementCheck.courses_completed);
      props.setNumRequired(requirementCheck.total_required);
      
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/get-concen-reqs?uid=${user.id}`
      );
      const data = await response.json();
      setDegreeInfo(data.requirements_options);
      console.log("Requirements for", degree, data.requirements_options);
    } catch (err) {
      console.error("Failed to fetch requirements:", err);
    }

    try {
      const encodedConcentration = encodeURIComponent(degree);
      const requestUrl = `${import.meta.env.VITE_BACKEND_URL}/check-concentration-requirements?uid=${user.id}&concentration=${encodedConcentration}`;

      console.log("Attempting to fetch /check-concentration-requirements. FULL URL being sent:", requestUrl);
      const response = await fetch(requestUrl
      );
      const data = await response.json();
      setCourseInfo(data.user_requirements_breakdown);
      props.setNumCompleted(data.courses_completed);
      props.setNumRequired(data.total_required)
      
      console.log("Breakdown for", user.id, data.user_requirements_breakdown);
    } catch (err) {
      console.error("Failed to fetch requirements:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, props]);

  // fetch and Load stored degree, done at very beginning and changes when user id changes
  useEffect(() => {
    const fetchConcentration = async () => {
      if (!user?.id) {
        const sessionData = sessionStorageUtils.getSessionData();
        if (sessionData?.concentration) {
          setSelectedDegree(sessionData.concentration);
          props.setDegree(sessionData.concentration);
          displayConcentrationRequirements(sessionData.concentration);
        }
        if (sessionData?.expandedSidebar !== undefined) {
          props.setExpanded(sessionData.expandedSidebar);
        }
        return;
      }
      
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/get-concentration?uid=${user.id}`
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

  // this useEffect calls displayConcentrationRequiements when page is first rendered or when the  refresh sidebar prop changes
  useEffect(() => {
    console.log("effecting");
    if (selectedDegree) {
      displayConcentrationRequirements(selectedDegree);
      fetchCapstoneData();
    }
  }, [props.refreshSidebar, selectedDegree, displayConcentrationRequirements, fetchCapstoneData]);
  
  // NEW useEffect to process flat data into nested structure
  useEffect(() => {
    if (degreeInfo && Object.keys(degreeInfo).length > 0) {
      const topLevelCategories: any[] = [];
      const parentToChildrenMap: Record<string, any[]> = {};

      // First pass: identify all children and their parents
      Object.keys(degreeInfo).forEach(key => {
        const item = degreeInfo[key];
        const parentCategory = item.parentCategory;
        if (parentCategory && parentCategory.length > 0) {
          if (!parentToChildrenMap[parentCategory]) {
            parentToChildrenMap[parentCategory] = [];
          }
          parentToChildrenMap[parentCategory].push(item);
        } else {
          topLevelCategories.push(item);
        }
      });
      
      // Second pass: build the nested structure
      const newNestedRequirements: any[] = [];
      topLevelCategories.forEach(item => {
        const children = parentToChildrenMap[item.categoryName];
        if (children) {
          newNestedRequirements.push({
            ...item,
            children: children
          });
        } else {
          newNestedRequirements.push(item);
        }
      });
      setNestedRequirements(newNestedRequirements);
    }
  }, [degreeInfo]);

  // Toggle expansion of sidebar
  const handleExpand = (key: string) => {
    setExpandedKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    console.log("key", key);
  };

  function stringToBool(str: string): boolean {
    return str.toLowerCase() === "true";
  }

  useEffect(() => {
    const getExpanded = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/get-expanded?uid=${user.id}`
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

  async function handleExpanded(stringValue: string) {
    const newExpandedState = !props.expanded;
    props.setExpanded(newExpandedState);
    
    if (!uid) {
      const sessionData = sessionStorageUtils.getSessionData() || { courses: [], semesters: {} };
      sessionData.expandedSidebar = newExpandedState;
      sessionStorageUtils.saveSessionData(sessionData);
    } else {
      await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/store-expanded?uid=${uid}&expanded=${stringValue}`,
        {
          method: "POST",
        }
      );
    }
  }

  async function handleChangeDegree(e: React.ChangeEvent<HTMLSelectElement>) {
    const newDegree = e.target.value;
    setSelectedDegree(newDegree);
    props.setDegree(newDegree);
    
    if (!uid) {
      const sessionData = sessionStorageUtils.getSessionData() || { courses: [], semesters: {} };
      sessionData.concentration = newDegree;
      sessionStorageUtils.saveSessionData(sessionData);
      displayConcentrationRequirements(newDegree);
    } else {
      try {
        await fetch(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/store-concentration?uid=${uid}&concentration=${newDegree}`,
          { method: "POST" }
        );
        console.log(`"Stored concentration"${newDegree}`);
        displayConcentrationRequirements(newDegree);
      } catch (err) {
        console.error("Network error while storing concentration:", err);
      }
    }
  }

  // Helper function to check if we should show any requirements
  const shouldShowRequirements = () => {
    return props.degree !== "Undeclared" && 
           !loading && 
           nestedRequirements && 
           nestedRequirements.length > 0;
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
        <>
          {loading ? (
            <div className="progress-check">
              <h3>Loading your progress...</h3>
            </div>
          ) : (
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
                <h3>
                  {props.numCompleted} out of {props.numRequired} credits
                  completed!
                </h3>
              </div>
              
              {/* MAIN CONCENTRATION REQUIREMENTS CONTAINER */}
              <div className="concentration-req-container">
                {shouldShowRequirements() &&
                  nestedRequirements.map((category) => {
                    const isExpanded = expandedKeys[category.categoryName];
                    
                    if (category.children) {
                      return (
                        <div key={category.categoryName} className="concentration-category">
                          <div className="concentration-row">
                            <button
                              onClick={() => handleExpand(category.categoryName)}
                              className="expand-button"
                            >
                              <svg
                                className={`button-icon ${isExpanded ? "rotated" : ""}`}
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
                            {category.displayName}
                          </div>
                          {isExpanded && (
                            <div className="subcategory-list">
                              {category.children.map((child: any) => (
                                <div key={child.categoryName} className="concentration-subcategory">
                                  <div className="subcategory-row">{child.displayName}</div>
                                  <ul className="requirement-list">
                                    {child.acceptedCourses.length === 0 ? (
                                      <p className="cannot-list">
                                        Sorry! Cannot list courses at the moment
                                      </p>
                                    ) : (
                                      child.acceptedCourses.map((course: string) => (
                                        <li
                                          key={course}
                                          className={`${
                                            (courseInfo[child.categoryName] || []).includes(course)
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
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    } else if (category.categoryName !== "Capstone") {
                      // Render regular categories (not capstone or parent of subcategories)
                      return (
                        <div key={category.categoryName} className="concentration-category">
                          <div className="concentration-row">
                            <button
                              onClick={() => handleExpand(category.categoryName)}
                              className="expand-button"
                            >
                              <svg
                                className={`button-icon ${isExpanded ? "rotated" : ""}`}
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
                            {category.displayName}
                          </div>

                          <div className="requirement-list-container">
                            {isExpanded && (
                              <div>
                                <ul className="requirement-list">
                                  {loading ? (
                                    <li>Loading Courses...</li>
                                  ) : category.acceptedCourses.length === 0 ? (
                                    <p className="cannot-list">
                                      Sorry! Cannot list courses at the moment
                                    </p>
                                  ) : (
                                    category.acceptedCourses.map((course: string) => (
                                      <li
                                        key={course}
                                        className={`${
                                          (courseInfo[category.categoryName] || []).includes(course)
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
                    }
                    return null;
                  })}

                {/* CAPSTONE SECTION - Only show if other requirements are also showing */}
                {shouldShowRequirements() && (
                  <div className="concentration-category">
                    <div className="concentration-row">
                      <button
                        onClick={() => handleExpand("Capstone")}
                        className="expand-button"
                      >
                        <svg
                          className={`button-icon ${expandedKeys["Capstone"] ? "rotated" : ""}`}
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
                      Capstone
                    </div>

                    <div className="requirement-list-container">
                      {expandedKeys["Capstone"] && (
                        <div>
                          <ul className="requirement-list">
                            {capstoneEligibleCourses.length === 0 ? (
                              <p className="cannot-list">
                                Sorry! Cannot list courses at the moment
                              </p>
                            ) : (
                              capstoneEligibleCourses.map((course) => (
                                <li
                                  key={course}
                                  className={`${
                                    props.currentCapstoneCourse === course
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
                )}
              </div>
            </div>
          )}
        </>
      )}
    </aside>
  );
}