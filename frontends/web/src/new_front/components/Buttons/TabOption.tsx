import React, { FC } from "react";

type TabOptionProps = {
  optionTab: number;
  tabName: string;
  openTab: number;
  setOpenTab: (openTab: number) => void;
};

const TabOption: FC<TabOptionProps> = ({
  optionTab,
  tabName,
  openTab,
  setOpenTab,
}) => {
  return (
    <li className="mr-2 last:mr-0 flex-auto text-center">
      <a
        className="relative block py-3"
        onClick={(e) => {
          e.preventDefault();
          setOpenTab(optionTab);
        }}
        data-toggle="tab"
        href="#link1"
        role="tablist"
      >
        <span
          className={
            "absolute inset-x-0 -bottom-px h-1 w-full" +
            (openTab === optionTab ? " bg-primary-color" : "")
          }
        ></span>
        <div className="flex items-center justify-center">
          <span className="ml-3 text-base font-medium text-gray-900">
            {tabName}
          </span>
        </div>
      </a>
    </li>
  );
};

export default TabOption;
