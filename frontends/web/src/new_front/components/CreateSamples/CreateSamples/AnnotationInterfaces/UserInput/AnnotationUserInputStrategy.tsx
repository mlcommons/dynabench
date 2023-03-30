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
import { AnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import { AnnotationUserInput } from "new_front/types/createSamples/createSamples/annotationUserInputs";
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
  const [userInputRenders, setUserInputRenders] = useState<
    ReactElement<AnnotationUserInput & AnnotationFactoryType>[]
  >([]);

  useEffect(() => {
    const getView = () => {
      config.map((option, index) => {
        const View = Import(ModulesRegistry.user_input[option.type]);
        setUserInputRenders((prev) => [
          ...prev,
          <View {...{ task, onInputChange, ...option }} key={index} />,
        ]);
      });
    };
    getView();
  }, []);

  return (
    <>
      {!isGenerativeContext && (
        <Suspense fallback={<BarLoader color="#ccebd4" />}>
          {userInputRenders}
        </Suspense>
      )}
    </>
  );
};

export default AnnotationUserInputStrategy;
