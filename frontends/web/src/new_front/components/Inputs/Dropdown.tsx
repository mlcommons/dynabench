import React, { FC, useState } from "react";
import { DropdownButton, Dropdown as BootsDropdown } from "react-bootstrap";

type DropdownProps = {
  options: any[];
  placeholder: string;
  onChange: (prompt: any) => void;
  disabled?: boolean;
};

const Dropdown: FC<DropdownProps> = ({
  options,
  placeholder,
  onChange,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full pb-6 text-right ">
      <div>
        <button
          type="button"
          className=" h-[47px] inline-flex w-full gap-x-1.5 rounded-md bg-white px-3 py-2  text-letter-color shadow-md ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none"
          id="menu-button"
          aria-expanded="true"
          aria-haspopup="true"
          onClick={() => setOpen(!open)}
        >
          <div className="flex justify-between w-full">
            <span className="pt-1">{placeholder}</span>
            <svg
              className="flex mt-1 -mr-1 text-gray-800 h-7 w-7 "
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </button>
      </div>

      <div
        className={`${
          open ? "block" : "hidden"
        } right-0 mt-2 w-full rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5`}
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="menu-button"
      >
        <div className="py-1" role="none">
          {options.map((option, key) => (
            <button
              key={key}
              type="button"
              className="block w-full px-4 py-2 text-left text-gray-700 border-solid rounded-sm focus:outline-none hover:bg-gray-100 hover:text-gray-900"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onChange(option);
              }}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>

    // <div classNameName="w-full py-2 ">
    //   <DropdownButton
    //     id="dropdown-basic-button"
    //     title={placeholder}
    //     classNameName="flex w-full pb-2"
    //     variant="secondary"
    //   >
    //     {options.map((option) => (
    //       <BootsDropdown.Item
    //         onClick={() => onChange(option)}
    //         classNameName="flex  w-full"
    //       >
    //         {option}
    //       </BootsDropdown.Item>
    //     ))}
    //   </DropdownButton>
    // </div>
  );
};

export default Dropdown;
