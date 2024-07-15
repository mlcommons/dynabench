import React, { useState } from "react";

type DropDownStatsProps = {
  options?: any[];
  placeholder?: string;
  onChange?: (round: number) => void;
  disabled?: boolean;
};

const DropDownStats = ({
  options,
  placeholder,
  onChange,
  disabled = false,
}: DropDownStatsProps) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block text-left">
      <div
        className="flex flex-row items-center justify-center pointer"
        onClick={() => setOpen(!open)}
      >
        <p className="text-sm font-medium tracking-widest text-white uppercase ">
          {placeholder}
        </p>
        {open ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5 mt-1 text-white stroke-current"
          >
            <path
              fillRule="evenodd"
              d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5 mt-1 text-white stroke-current"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
      <div
        className={`${
          open ? "block" : "hidden"
        } absolute z-10 h-44 md:h-24 right-0 mt-2 w-full rounded-md shadow-lg  ring-1 ring-black ring-opacity-5 overflow-auto hide-scroll-bar bg-slate-50 md:bg-transparent`}
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="menu-button"
        tabIndex={-1}
      >
        {options?.map((option, key) => (
          <p
            key={key}
            className="block w-full px-4 py-2 text-xl text-left text-gray md:text-white pointer"
            role="menuitem"
            onClick={() => {
              onChange!(option);
              setOpen(false);
            }}
          >
            {option}
          </p>
        ))}
      </div>
    </div>
  );
};

export default DropDownStats;
