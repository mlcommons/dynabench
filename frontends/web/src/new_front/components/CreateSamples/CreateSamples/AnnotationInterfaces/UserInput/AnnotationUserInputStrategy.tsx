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
import { AnnotationUserInputs } from "new_front/types/createSamples/annotationUserInputs";
import { BarLoader } from "react-spinners";

const Import = (
  module: string
): LazyExoticComponent<ComponentType<AnnotationFactoryType>> =>
  React.lazy(() => import(`./${module}`).catch(() => import(`./GoalFallback`)));

type Props = {
  config: AnnotationUserInputs;
};

const AnnotationUserInputStrategy: FC<Props & AnnotationFactoryType> = ({
  config,
  task,
  onInputChange,
}) => {
  const [goalRenders, setGoalRenders] = useState<
    ReactElement<AnnotationUserInputs & AnnotationFactoryType>[]
  >([]);

  useEffect(() => {
    const getView = async () => {
      config.options.map((option, index) => {
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
    <Suspense fallback={<BarLoader color="#ccebd4" />}>{goalRenders}</Suspense>
  );
};

export default AnnotationUserInputStrategy;
