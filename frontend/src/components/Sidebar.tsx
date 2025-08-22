import { AlignJustify } from "lucide-react";
import "../styles/Sidebar.css";
import "../styles/App.css";
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
  useCallback,
} from "react";
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

  const [capstoneEligibleCourses, setCapstoneEligibleCourses] = useState<
    string[]
  >([]);

  const [nestedRequirements, setNestedRequirements] = useState<any[]>([]);

  // fetch capstone data
  const fetchCapstoneData = useCallback(async () => {
    if (
      !user?.id ||
      !selectedDegree ||
      selectedDegree === "Select a Concentration" ||
      selectedDegree.trim() === ""
    ) {
      setCapstoneEligibleCourses([]);
      return;
    }

    try {
      const encodedConcentration = encodeURIComponent(selectedDegree);
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/check-capstones?uid=${
          user.id
        }&concentration=${encodedConcentration}`
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
  const displayConcentrationRequirements = useCallback(
    async (degree: string) => {
      if (
        !degree ||
        degree === "Select a Concentration" ||
        degree.trim() === ""
      ) {
        console.log("Skipping requirement display: Invalid concentration.", {
          concentrationValue: degree,
        });
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
        // Transform the simple object structure into the expected format
        const transformedRequirements: Record<string, any> = {};

        // Define which categories are elective subcategories
        const electiveSubcategories = [
          "Linear Algebra (1)",
          "Software Engineering (1)",
          "CSCI 1xxx/2xxx (2)",
          "External Course (3)",
          "Non-technical (1)",
          "CSCI 1970 (2)",
        ];

        Object.entries(requirements.requirements_options).forEach(
          ([key, courses]) => {
            // Check if this is an elective subcategory
            const isElectiveSubcategory = electiveSubcategories.includes(key);

            // Handle display name for Technical Courses
            let displayName = key;
            if (key === "Technical Courses") {
              const isScB = degree && degree.includes("Sc.B");
              displayName = isScB
                ? "5 Technical CSCI 1000-level courses"
                : "2 Technical CSCI 1000-level courses";
            }

            transformedRequirements[key] = {
              categoryName: key,
              displayName: displayName,
              acceptedCourses: courses,
              parentCategory: isElectiveSubcategory ? "Electives (Total)" : "",
            };
          }
        );
        setDegreeInfo(transformedRequirements);

        const sessionData = sessionStorageUtils.getSessionData();
        const userCourses = sessionData?.courses || [];

        const requirementCheck = concentrationUtils.checkRequirements(
          userCourses,
          degree
        );
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
        console.log("Raw backend response for requirements:", data);
        console.log(
          "Requirements_options structure:",
          data.requirements_options
        );

        // Check if the data needs transformation
        if (data.requirements_options) {
          const firstKey = Object.keys(data.requirements_options)[0];
          if (firstKey) {
            console.log(
              `Sample item for key ${firstKey}:`,
              data.requirements_options[firstKey]
            );
          }

          // Add elective subcategories if they don't exist (for signed-in users)
          const electiveSubcategories = [
            "Linear Algebra (1)",
            "Software Engineering (1)",
            "CSCI 1xxx/2xxx (2)",
            "External Course (3)",
            "Non-technical (1)",
            "CSCI 1970 (2)",
          ];

          // Check if we have these subcategories, if not, add them
          electiveSubcategories.forEach((subcategory) => {
            if (!data.requirements_options[subcategory]) {
              // Create placeholder for elective subcategories
              data.requirements_options[subcategory] = {
                categoryName: subcategory,
                displayName: subcategory,
                acceptedCourses:
                  subcategory === "CSCI 1xxx/2xxx (2)"
                    ? ["CSCI 1xxx", "CSCI 2xxx"]
                    : subcategory === "CSCI 1970 (2)"
                    ? ["CSCI 1970"]
                    : subcategory === "External Course (3)"
                    ? ["External courses approved by concentration advisor"]
                    : subcategory === "Non-technical (1)"
                    ? ["Any non-CS course"]
                    : subcategory === "Software Engineering (1)"
                    ? ["CSCI 0320", "CSCI 1320"]
                    : subcategory === "Linear Algebra (1)"
                    ? ["MATH 0520", "MATH 0540", "CSCI 0530"]
                    : [],
                parentCategory: "Electives (Total)",
              };
            } else if (Array.isArray(data.requirements_options[subcategory])) {
              // If it's an array, transform it to object format
              data.requirements_options[subcategory] = {
                categoryName: subcategory,
                displayName: subcategory,
                acceptedCourses: data.requirements_options[subcategory],
                parentCategory: "Electives (Total)",
              };
            } else if (
              data.requirements_options[subcategory] &&
              typeof data.requirements_options[subcategory] === "object"
            ) {
              // Ensure it has the parent category set
              data.requirements_options[subcategory].parentCategory =
                "Electives (Total)";
            }
          });
        }

        setDegreeInfo(data.requirements_options);
      } catch (err) {
        console.error("Failed to fetch requirements:", err);
      }

      try {
        const encodedConcentration = encodeURIComponent(degree);
        const requestUrl = `${
          import.meta.env.VITE_BACKEND_URL
        }/check-concentration-requirements?uid=${
          user.id
        }&concentration=${encodedConcentration}`;

        console.log(
          "Attempting to fetch /check-concentration-requirements. FULL URL being sent:",
          requestUrl
        );
        const response = await fetch(requestUrl);
        const data = await response.json();
        setCourseInfo(data.user_requirements_breakdown);
        props.setNumCompleted(data.courses_completed);
        props.setNumRequired(data.total_required);

        console.log("Breakdown for", user.id, data.user_requirements_breakdown);
      } catch (err) {
        console.error("Failed to fetch requirements:", err);
      } finally {
        setLoading(false);
      }
    },
    [user?.id, props]
  );

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
  }, [
    props.refreshSidebar,
    selectedDegree,
    displayConcentrationRequirements,
    fetchCapstoneData,
  ]);

  // NEW useEffect to process flat data into nested structure
  useEffect(() => {
    if (degreeInfo && Object.keys(degreeInfo).length > 0) {
      console.log("DegreeInfo structure:", degreeInfo);
      let topLevelCategories: any[] = [];
      const parentToChildrenMap: Record<string, any[]> = {};

      // First pass: identify all children and their parents
      Object.keys(degreeInfo).forEach((key) => {
        let item = degreeInfo[key];

        // If item is an array, convert it to the expected object structure
        if (Array.isArray(item)) {
          item = {
            categoryName: key,
            displayName: key,
            acceptedCourses: item,
            parentCategory: "",
          };
          degreeInfo[key] = item;
        } else if (typeof item === "object" && item !== null) {
          // Ensure we have categoryName and displayName
          if (!item.categoryName) {
            item.categoryName = key;
          }
          if (!item.displayName) {
            // Special handling for Technical Courses
            if (key === "Technical Courses") {
              const isScB = selectedDegree && selectedDegree.includes("Sc.B");
              item.displayName = isScB
                ? "5 Technical CSCI 1000-level courses"
                : "2 Technical CSCI 1000-level courses";
              // Also simplify the course list if it has many courses
              if (item.acceptedCourses && item.acceptedCourses.length > 5) {
                item.acceptedCourses = ["CSCI 1xxx"];
              }
            } else if (
              key === "5 Technical CSCI 1000-level courses" ||
              key === "2 Technical CSCI 1000-level courses"
            ) {
              item.displayName = key;
              if (!item.acceptedCourses || item.acceptedCourses.length === 0) {
                item.acceptedCourses = ["CSCI 1xxx"];
              }
            } else {
              item.displayName = key; // Use the key as display name if not provided
            }
          }
          // Try to find the courses array under different possible property names
          if (!item.acceptedCourses) {
            if (item.courses) {
              item.acceptedCourses = item.courses;
            } else if (item.courseList) {
              item.acceptedCourses = item.courseList;
            } else if (item.course_list) {
              item.acceptedCourses = item.course_list;
            } else if (Array.isArray(item.accepted_courses)) {
              item.acceptedCourses = item.accepted_courses;
            } else {
              // If no courses array found, initialize as empty
              item.acceptedCourses = [];
            }
          }
        }
        console.log(`Processing category ${key}:`, item);

        // Check if this should be an elective subcategory based on its name
        const electiveSubcategories = [
          "Linear Algebra (1)",
          "Software Engineering (1)",
          "CSCI 1xxx/2xxx (2)",
          "External Course (3)",
          "Non-technical (1)",
          "CSCI 1970 (2)",
        ];

        // Override parent category for known elective subcategories
        let parentCategory = item.parentCategory;
        if (
          electiveSubcategories.includes(key) ||
          electiveSubcategories.includes(item.categoryName)
        ) {
          parentCategory = "Electives (Total)";
          item.parentCategory = parentCategory;
        }
        if (parentCategory && parentCategory.length > 0) {
          if (!parentToChildrenMap[parentCategory]) {
            parentToChildrenMap[parentCategory] = [];
          }
          parentToChildrenMap[parentCategory].push(item);
        } else {
          topLevelCategories.push(item);
        }
      });

      // Check if we have electives subcategories
      const electivesChildren = parentToChildrenMap["Electives (Total)"] || [];
      console.log("Electives children found:", electivesChildren);
      console.log("Parent to children map:", parentToChildrenMap);

      // If we have electives subcategories, create an Electives parent
      if (electivesChildren.length > 0) {
        // Create or find the Electives parent category
        let electivesParent = topLevelCategories.find(
          (cat) =>
            cat.categoryName === "Electives" ||
            cat.categoryName === "Electives (Total)"
        );

        if (!electivesParent) {
          // Determine the display name based on degree type
          const isScB = selectedDegree && selectedDegree.includes("Sc.B");
          const electivesDisplayName = isScB ? "4 Electives" : "2 Electives";

          // Create a new Electives parent if it doesn't exist
          electivesParent = {
            categoryName: "Electives",
            displayName: electivesDisplayName,
            acceptedCourses: [], // Parent won't have direct courses
            parentCategory: "",
            children: electivesChildren,
          };
          topLevelCategories.push(electivesParent);
        } else {
          // Update display name and add children to existing Electives category
          const isScB = selectedDegree && selectedDegree.includes("Sc.B");
          electivesParent.displayName = isScB ? "4 Electives" : "2 Electives";
          electivesParent.children = electivesChildren;
        }

        // Remove the Electives (Total) from top level if it exists
        topLevelCategories = topLevelCategories.filter(
          (cat) => cat.categoryName !== "Electives (Total)"
        );
      }

      // Second pass: build the nested structure
      const newNestedRequirements: any[] = [];
      topLevelCategories.forEach((item) => {
        const children =
          item.children || parentToChildrenMap[item.categoryName];
        if (children && children.length > 0) {
          newNestedRequirements.push({
            ...item,
            children: children,
          });
        } else if (
          item.categoryName !== "Electives" ||
          item.acceptedCourses?.length > 0
        ) {
          // Only add non-Electives items or Electives with courses
          newNestedRequirements.push(item);
        }
      });
      console.log("Nested requirements structure:", newNestedRequirements);
      setNestedRequirements(newNestedRequirements);
    }
  }, [degreeInfo, selectedDegree]);

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
      const sessionData = sessionStorageUtils.getSessionData() || {
        courses: [],
        semesters: {},
      };
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
      const sessionData = sessionStorageUtils.getSessionData() || {
        courses: [],
        semesters: {},
      };
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
    return (
      props.degree !== "Undeclared" &&
      !loading &&
      nestedRequirements &&
      nestedRequirements.length > 0
    );
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
                <option value="Computer Science A.B.">
                  Computer Science A.B.
                </option>
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
                  nestedRequirements
                    .filter((category) => category.categoryName !== "Capstone")
                    .map((category) => {
                      const isExpanded = expandedKeys[category.categoryName];

                      if (category.children) {
                        return (
                          <div
                            key={category.categoryName}
                            className="concentration-category"
                          >
                            <div className="concentration-row">
                              <button
                                onClick={() =>
                                  handleExpand(category.categoryName)
                                }
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
                              {category.displayName || category.categoryName}
                            </div>
                            {isExpanded && (
                              <div className="subcategory-list">
                                {category.children.map((child: any) => {
                                  const isChildExpanded =
                                    expandedKeys[child.categoryName];
                                  return (
                                    <div
                                      key={child.categoryName}
                                      className="concentration-subcategory"
                                    >
                                      <div className="subcategory-row">
                                        <button
                                          onClick={() =>
                                            handleExpand(child.categoryName)
                                          }
                                          className="expand-button subcategory-expand"
                                        >
                                          <svg
                                            className={`button-icon ${
                                              isChildExpanded ? "rotated" : ""
                                            }`}
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                            fill="white"
                                            width="20"
                                            height="20"
                                            style={{ display: "block" }}
                                          >
                                            <path
                                              fillRule="evenodd"
                                              d="M10 14a1 1 0 01-.707-.293l-5-5a1 1 0 011.414-1.414L10 11.586l4.293-4.293a1 1 0 011.414 1.414l-5 5A1 1 0 0110 14z"
                                              clipRule="evenodd"
                                            />
                                          </svg>
                                        </button>
                                        {child.displayName ||
                                          child.categoryName}
                                      </div>
                                      {isChildExpanded && (
                                        <ul className="requirement-list subcategory-courses">
                                          {!child.acceptedCourses ||
                                          child.acceptedCourses.length === 0 ? (
                                            <li className="debug-info">
                                              No courses for{" "}
                                              {child.categoryName}
                                            </li>
                                          ) : (
                                            (child.acceptedCourses || []).map(
                                              (course: string) => (
                                                <li
                                                  key={course}
                                                  className={`${
                                                    (
                                                      courseInfo[
                                                        child.categoryName
                                                      ] || []
                                                    ).includes(course)
                                                      ? "requirement_completed"
                                                      : "requirement_not_completed"
                                                  }`}
                                                >
                                                  {course}
                                                </li>
                                              )
                                            )
                                          )}
                                        </ul>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      } else if (category.categoryName !== "Capstone") {
                        // Render regular categories (not capstone or parent of subcategories)
                        return (
                          <div
                            key={category.categoryName}
                            className="concentration-category"
                          >
                            <div className="concentration-row">
                              <button
                                onClick={() =>
                                  handleExpand(category.categoryName)
                                }
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
                              {category.displayName || category.categoryName}
                            </div>

                            <div className="requirement-list-container">
                              {isExpanded && (
                                <div>
                                  <ul className="requirement-list">
                                    {loading ? (
                                      <li>Loading Courses...</li>
                                    ) : !category.acceptedCourses ||
                                      category.acceptedCourses.length === 0 ? (
                                      <li className="debug-info">
                                        No courses available for{" "}
                                        {category.categoryName}
                                        {console.log(
                                          "Category with no courses:",
                                          category
                                        )}
                                      </li>
                                    ) : (
                                      (category.acceptedCourses || []).map(
                                        (course: string) => (
                                          <li
                                            key={course}
                                            className={`${
                                              (
                                                courseInfo[
                                                  category.categoryName
                                                ] || []
                                              ).includes(course)
                                                ? "requirement_completed"
                                                : "requirement_not_completed"
                                            }`}
                                          >
                                            {course}
                                          </li>
                                        )
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }
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
                          className={`button-icon ${
                            expandedKeys["Capstone"] ? "rotated" : ""
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
