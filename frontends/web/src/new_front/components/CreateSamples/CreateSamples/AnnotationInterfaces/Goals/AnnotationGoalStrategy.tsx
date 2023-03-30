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
import { AnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { GoalConfigType } from "new_front/types/createSamples/createSamples/annotationGoal";
import { BarLoader } from "react-spinners";

const Import = (
  module: string
): LazyExoticComponent<ComponentType<AnnotationFactoryType>> =>
  React.lazy(() => import(`./${module}`).catch(() => import(`./GoalFallback`)));

type Props = {
  config: GoalConfigType;
};

const AnnotationGoalStrategy: FC<Props & AnnotationFactoryType> = ({
  config,
  task,
  onInputChange,
  hidden,
}) => {
  const [goalRender, setGoalRender] =
    useState<ReactElement<GoalConfigType & AnnotationFactoryType>>();

  useEffect(() => {
    const getView = () => {
      const View = Import(ModulesRegistry.goal[config.type]);
      setGoalRender(<View {...{ task, hidden, onInputChange, ...config }} />);
    };
    getView();
  }, [hidden]);

  return (
    <Suspense fallback={<BarLoader color="#ccebd4" />}>{goalRender}</Suspense>
  );
};

export default AnnotationGoalStrategy;
