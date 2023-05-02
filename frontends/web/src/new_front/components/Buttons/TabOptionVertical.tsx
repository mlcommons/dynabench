import React, { FC } from "react";

type TabOptionVerticalProps = {
  optionTab: number;
  tabName: string;
  openTab: number;
  documentationUrl?: string;
  setOpenTab?: (openTab: number) => void;
};

const TabOptionVertical: FC<TabOptionVerticalProps> = ({
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
        <span className={"absolute inset-x-0 -bottom-px h-1 w-full"}></span>
        <div className="flex pl-2">
          <span className="mx-2 text-lg font-medium capitalize text-letter-color">
            {tabName}
          </span>
        </div>
      </a>
    </li>
  );
};

export default TabOptionVertical;
