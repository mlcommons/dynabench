import { AnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { GoalConfigType } from "new_front/types/createSamples/createSamples/annotationGoal";
import React, { FC } from "react";

const Plain: FC<AnnotationFactoryType & GoalConfigType> = ({ text }) => {
  return <div>{text}</div>;
};

export default Plain;
