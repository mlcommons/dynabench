import React, { FC } from "react";
import { AnnotationTitleType } from "../../types/createSamples/annotationTitle";

const AnnotationTitle: FC<AnnotationTitleType> = ({
  taskName,
  selectedModel,
  randomTargetModel,
}) => {
  return (
    <div className="mt-4 mb-1 pt-3">
      <p className="text-uppercase mb-0 spaced-header">
        {taskName || <span>&nbsp;</span>}
      </p>
      {selectedModel ? (
        <h2 className="text-xl d-block ml-0 mt-0 text-reset">
          Find examples that fool <i>{selectedModel.name}</i>
        </h2>
      ) : (
        <h2 className="text-xl d-block ml-0 mt-0 text-reset">
          {randomTargetModel
            ? "Find examples that fool the model"
            : "Find examples"}
        </h2>
      )}
    </div>
  );
};

export default AnnotationTitle;
