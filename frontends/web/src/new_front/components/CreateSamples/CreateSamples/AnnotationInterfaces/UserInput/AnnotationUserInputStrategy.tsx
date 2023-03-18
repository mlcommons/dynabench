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
import { AnnotationFactoryType } from "new_front/types/createSamples/annotationFactory";
import { AnnotationUserInput } from "new_front/types/createSamples/annotationUserInputs";
import { BarLoader } from "react-spinners";

const Import = (
  module: string
): LazyExoticComponent<ComponentType<AnnotationFactoryType>> =>
  React.lazy(() => import(`./${module}`).catch(() => import(`./GoalFallback`)));

type Props = {
  config: AnnotationUserInput[];
  isGenerativeContext: boolean;
};

const AnnotationUserInputStrategy: FC<Props & AnnotationFactoryType> = ({
  config,
  task,
  onInputChange,
  isGenerativeContext,
}) => {
  const [goalRenders, setGoalRenders] = useState<
    ReactElement<AnnotationUserInput & AnnotationFactoryType>[]
  >([]);

  useEffect(() => {
    const getView = async () => {
      config.map((option, index) => {
        const View = Import(ModulesRegistry.input[option.type]);
        setGoalRenders((prev) => [
          ...prev,
          <View {...{ onInputChange, task, ...option }} key={index} />,
        ]);
      });
    };
    getView();
  }, []);

  return (
    <>
      {!isGenerativeContext && (
        <Suspense fallback={<BarLoader color="#ccebd4" />}>
          {goalRenders}
        </Suspense>
      )}
    </>
  );
};

export default AnnotationUserInputStrategy;
