import { AnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { GoalConfigType } from "new_front/types/createSamples/createSamples/annotationGoal";
import React, { FC } from "react";

const Plain: FC<AnnotationFactoryType & GoalConfigType> = ({ text }) => {
  return <div className="p-3 border rounded bg-[#f0f2f5] pl-6">{text}</div>;
};

export default Plain;
