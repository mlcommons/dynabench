import React, { useState, useEffect } from "react";

interface ChipsSelectorProps {
  options: any[];
  onSelect: (prompt: any) => void;
  selectedTag: number;
}

const ChipsSelector: React.FC<ChipsSelectorProps> = ({
  options,
  onSelect,
  selectedTag,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = parseInt(event.key);
      if (!isNaN(key) && key > 0 && key <= options.length) {
        const newIndex = key - 1; // Convert to 0-based index
        setSelectedIndex(newIndex);

        // Call the optional callback if provided
        if (onSelect) {
          onSelect(options[newIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [options, options.length, onSelect]);

  useEffect(() => {
    selectedTag >= 0 && setSelectedIndex(selectedTag);
  }, [selectedTag]);

  const handleChipClick = (index: number) => {
    setSelectedIndex(index);
    onSelect(options[index]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => handleChipClick(index)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            ${
              selectedIndex === index
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          aria-pressed={selectedIndex === index}
        >
          <span className="mr-1">{index + 1}:</span> {option.back_label}
        </button>
      ))}
    </div>
  );
};

export default ChipsSelector;
