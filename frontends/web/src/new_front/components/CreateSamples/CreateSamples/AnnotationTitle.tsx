import React, { FC } from "react";

type AnnotationTitleType = {
  taskName: string;
  subtitle: string;
  selectedModel?: string;
};

const AnnotationTitle: FC<AnnotationTitleType> = ({ taskName, subtitle }) => {
  return (
    <div className="pt-3 mt-4 mb-1">
      <p className="mb-0 text-uppercase spaced-header">
        {taskName || <span>&nbsp;</span>}
      </p>
      <h2 className="mt-0 ml-0 text-xl d-block text-reset">{subtitle}</h2>
    </div>
  );
};

export default AnnotationTitle;
