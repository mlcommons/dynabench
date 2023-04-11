import AnnotationInstruction from "new_front/components/OverlayInstructions/Annotation";
import { AnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { GoalConfigType } from "new_front/types/createSamples/createSamples/annotationGoal";
import React, { FC } from "react";

const Plain: FC<AnnotationFactoryType & GoalConfigType> = ({
  text,
  instruction,
}) => {
  return (
    <AnnotationInstruction
      placement="top"
      tooltip={instruction || "Select one of the options below"}
    >
      <div className="p-3 border rounded bg-[#f0f2f5] pl-6">{text}</div>
    </AnnotationInstruction>
  );
};

export default Plain;
