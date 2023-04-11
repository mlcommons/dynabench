import ModulesRegistry from "new_front/utils/creation_interface_options.json";
import React, {
  FC,
  ReactElement,
  useEffect,
  useState,
  Suspense,
  LazyExoticComponent,
  ComponentType,
} from "react";
import {
  AnnotationFactoryType,
  ContextAnnotationFactoryType,
} from "new_front/types/createSamples/createSamples/annotationFactory";
import { GoalConfigType } from "new_front/types/createSamples/createSamples/annotationGoal";
import { BarLoader } from "react-spinners";
import { ContextConfigType } from "new_front/types/createSamples/createSamples/annotationContext";

const Import = (
  module: string
): LazyExoticComponent<ComponentType<AnnotationFactoryType>> =>
  React.lazy(() => import(`./${module}`).catch(() => import(`./GoalFallback`)));

type Props = {
  config: ContextConfigType;
};

const AnnotationContextStrategy: FC<Props & ContextAnnotationFactoryType> = ({
  config,
  context,
  contextId,
  taskId,
  realRoundId,
  hidden,
  setIsGenerativeContext,
  setPartialSampleId,
}) => {
  const [goalRender, setGoalRender] =
    useState<ReactElement<ContextConfigType & ContextAnnotationFactoryType>>();

  useEffect(() => {
    const getView = () => {
      const View = Import(ModulesRegistry.context[config.type]);
      setGoalRender(
        <View
          {...{
            context,
            taskId,
            contextId,
            realRoundId,
            hidden,
            setIsGenerativeContext,
            setPartialSampleId,
            ...config,
          }}
        />
      );
    };
    getView();
  }, [hidden]);

  return (
    <Suspense fallback={<BarLoader color="#ccebd4" />}>{goalRender}</Suspense>
  );
};

export default AnnotationContextStrategy;
