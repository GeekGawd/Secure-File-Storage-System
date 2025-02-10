import React, { useState, useEffect } from 'react';
import { useSearchParams } from "react-router-dom";
import useDebounce from "@/hooks/useDebounce";

const SearchBar: React.FC = () => {

  // Initialize searchParams from the URL
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  // State for the search input
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);

  // Debounced search value
  const searchDebouncedValue = useDebounce(searchQuery, 500);

  // Handle input changes
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };


  // Update the URL search parameters when the debounced search value changes
  useEffect(() => {
    if (searchDebouncedValue) {
      setSearchParams(() => {
        searchParams.delete("page");
        searchParams.set("search", searchDebouncedValue)
        return searchParams;
        }
      );
    } else {
      setSearchParams((() => {
        return new URLSearchParams();
        }));
    }
  }, [searchDebouncedValue]);

  return (
    <div className="relative w-full max-w-xl">
      <input
        type="text"
        value={searchQuery}
        onChange={handleChange}
        placeholder="Search..."
        className="w-full px-4 py-2 text-gray-700 bg-white border rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
    </div>
  );
};

export default SearchBar;
