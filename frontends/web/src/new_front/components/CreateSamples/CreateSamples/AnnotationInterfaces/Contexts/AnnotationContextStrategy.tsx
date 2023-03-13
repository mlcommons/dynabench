import ModulesRegistry from "new_front/utils/interface_options.json";
import React, {
  FC,
  ReactElement,
  useEffect,
  useState,
  Suspense,
  ComponentType,
  LazyExoticComponent,
} from "react";
import {
  AnnotationFactoryType,
  ContextAnnotationFactoryType,
} from "new_front/types/createSamples/annotationFactory";
import { ContextConfigType } from "new_front/types/createSamples/annotationContext";
import { BarLoader } from "react-spinners";

const Import = (
  module: string
): LazyExoticComponent<ComponentType<AnnotationFactoryType>> =>
  React.lazy(() => import(`./${module}`).catch(() => import(`./GoalFallback`)));

type Props = {
  config: ContextConfigType;
};

const AnnotationContextStrategy: FC<Props & ContextAnnotationFactoryType> = ({
  config,
  task,
  context,
  onInputChange,
  setIsGenerativeContext,
}) => {
  const [goalRender, setGoalRender] =
    useState<ReactElement<ContextConfigType & ContextAnnotationFactoryType>>();

  useEffect(() => {
    const getView = async () => {
      const View = await Import(ModulesRegistry.context[config.type]);
      setGoalRender(
        <View
          {...{
            onInputChange,
            setIsGenerativeContext,
            task,
            context,
            ...config,
          }}
        />
      );
    };
    getView();
  }, []);

  return (
    <Suspense fallback={<BarLoader color="#ccebd4" />}>{goalRender}</Suspense>
  );
};

export default AnnotationContextStrategy;
