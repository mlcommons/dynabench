import React, { FC } from "react";

type TabOptionProps = {
  optionTab: number;
  tabName: string;
  openTab: number;
  documentationUrl?: string;
  setOpenTab?: (openTab: number) => void;
};

const TabOption: FC<TabOptionProps> = ({
  optionTab,
  tabName,
  openTab,
  documentationUrl,
  setOpenTab,
}) => {
  return (
    <li className="flex-auto mr-2 text-center last:mr-0">
      <a
        className="relative block py-3"
        onClick={(e) => {
          if (!setOpenTab) return;
          e.preventDefault();
          setOpenTab(optionTab);
        }}
        data-toggle="tab"
        target="_blank"
        href={setOpenTab ? "#link1" : documentationUrl}
        role="tablist"
        rel="noreferrer"
      >
        <span
          className={
            "absolute inset-x-0 -bottom-px h-1 w-full" +
            (openTab === optionTab ? " bg-primary-color" : "")
          }
        ></span>
        <div className="flex items-center justify-center">
          <span className="ml-3 text-base font-medium text-letter-color">
            {tabName}
          </span>
        </div>
      </a>
    </li>
  );
};

export default TabOption;
