import SearchBar from "./SearchBar.tsx";

const handleSearch = (query: string) => {
  console.log("Search query:", query);
  // You can filter a list, trigger an API, etc.
};

function BearTracks() {
  return (
    <div>
      <SearchBar onSearch={handleSearch} />
      <p>search</p>
    </div>
  );
}
export default BearTracks;
