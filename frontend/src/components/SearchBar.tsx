import { useState } from "react";
import "../styles/SearchBar.css";

// this defines the props for the SearchBar component
interface SearchBarProps {
  onSearch: (query: string) => void;
}

// the component for the search input
export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState("");

  // this is a handler for changes to the input 
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={handleChange}
        className="search-bar-input"
      />
    </div>
  );
}
