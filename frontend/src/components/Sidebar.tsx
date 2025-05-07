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
import { Dispatch, SetStateAction, useState, useEffect } from "react";
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
  const [degreeInfo, setDegreeInfo] = useState<Record<string, any>>({}); // Initialize dropdown from backend for existing users

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

  const displayConcentrationRequirements = async (degree: string) => {
    if (!user?.id || !degree) return;
    try {
      const response = await fetch(
        `http://localhost:3232/check-concentration-requirements?uid=${user.id}`
      );
      const data = await response.json();
      setDegreeInfo(data.requirements_options);
      console.log("Requirements for", degree, data.requirements_options);
    } catch (err) {
      console.error("Failed to fetch requirements:", err);
    }
    console.log("display");
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
                    
          <select // value={selectedDegree} // onChange={(e) => { //   const newDegree = e.target.value; //   setSelectedDegree(newDegree); //   props.setDegree(newDegree); //   // Store concentration in backend and display requirements //   fetch( //     `http://localhost:3232/store-concentration?uid=${uid}&concentration=${newDegree}`, //     { method: "POST" } //   ) //     .then(() => { //       console.log("Stored concentration"); //       displayConcentrationRequirements(newDegree); //     }) //     .catch((err) => //       console.error( //         "Network error while storing concentration:", //         err //       ) //     ); // }} // className="concentration-dropdown"
          >
                        <option value="">Select a Concentration</option>
                        
            <option value="Computer Science Sc.B.">
                            Computer Science Sc.B.             
            </option>
                        
            <option value="Computer Science A.B.">Computer Science A.B.</option>
                      
          </select>
                    
          {/* <div className="concentration-req-container">
            <ul>
              {Object.keys(degreeInfo)
                .reverse()
                .map((key) => (
                  <li key={key}>{key}</li>
                ))}
            </ul>{" "}
          </div> */}
                  
        </div>
      )}
          
    </aside>
  );
}
