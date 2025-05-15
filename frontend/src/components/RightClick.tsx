import "../styles/RightClick.css";

interface RightClickMenuProps {
  position: { x: number; y: number };
  onAddRightSemester: () => void;
  onAddLeftSemester: () => void;
  onDeleteSemester: () => void;
}

// this is the component to render the right-click menu
const RightClickMenu = (props: RightClickMenuProps) => {
  return (
    <div
      style={{
        position: "fixed",
        top: `${props.position.y}px`,
        left: `${props.position.x}px`,
        background: "white",
        border: "1px solid #ccc",
        borderRadius: "5px",
        boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
        padding: "10px 0",
        zIndex: 1000,
        width: "200px",
        backgroundColor: "white",
      }}
    >
      <ul
        style={{ listStyleType: "none", margin: 0, padding: 0 }}
        className="menu"
      >
        {/* Option to add a semester to the left */}
        <li className="menu-item" onClick={props.onAddLeftSemester}>
          Add Semester to the Left
        </li>
        <hr />
        {/* Option to add a semester to the right */}
        <li className="menu-item" onClick={props.onAddRightSemester}>
          Add Semester to the Right
        </li>
        <hr />
        {/* Option to delete a semester */}
        <li className="menu-item" onClick={props.onDeleteSemester}>
          Delete Semester
        </li>
      </ul>
    </div>
  );
};

export default RightClickMenu;
