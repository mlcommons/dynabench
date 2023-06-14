import React, { FC } from "react";

type ChevronExpandButtonProps = {
  expanded: boolean;
};

const ChevronExpandButton: FC<ChevronExpandButtonProps> = ({ expanded }) => {
  return (
    <>
      <span>
        {expanded ? (
          <i className="fas fa-chevron-down pointer h-4" />
        ) : (
          <i className="fas fa-chevron-right pointer h-4" />
        )}
      </span>
    </>
  );
};

export default ChevronExpandButton;
