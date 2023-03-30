import ModulesRegistry from "new_front/utils/creation_interface_options.json";
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
} from "new_front/types/createSamples/createSamples/annotationFactory";
import { ContextConfigType } from "new_front/types/createSamples/createSamples/annotationContext";
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
  createPartialSample,
  onInputChange,
  setIsGenerativeContext,
}) => {
  const [contextRender, setContextRender] =
    useState<ReactElement<ContextConfigType & ContextAnnotationFactoryType>>();

  useEffect(() => {
    const getView = async () => {
      const View = await Import(ModulesRegistry.context[config.type]);
      setContextRender(
        <View
          {...{
            task,
            context,
            createPartialSample,
            onInputChange,
            setIsGenerativeContext,
            ...config,
          }}
        />
      );
    };
    getView();
  }, []);

  return (
    <Suspense fallback={<BarLoader color="#ccebd4" />}>
      {contextRender}
    </Suspense>
  );
};

export default AnnotationContextStrategy;
