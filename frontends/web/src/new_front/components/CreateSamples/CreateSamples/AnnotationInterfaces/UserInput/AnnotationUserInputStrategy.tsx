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
  groupby?: number;
};

const AnnotationUserInputStrategy: FC<Props & AnnotationFactoryType> = ({
  config,
  isGenerativeContext,
  groupby = 0,
}) => {
  const [userInputRenders, setUserInputRenders] = useState<
    ReactElement<AnnotationUserInput & AnnotationFactoryType>[]
  >([]);

  useEffect(() => {
    const getView = () => {
      const newRenders: ReactElement<
        AnnotationUserInput & AnnotationFactoryType
      >[] = [];
      config.forEach((option, index) => {
        const View = Import(ModulesRegistry.user_input[option.type]);
        newRenders.push(<View {...{ ...option }} key={`AUIS${index}`} />);

        if ((index + 1) % groupby === 0 && groupby !== 0) {
          newRenders.push(
            <hr className="divider mx-5 my-3" key={`AUIS${index}divider`} />
          );
        }
      });

      setUserInputRenders(newRenders);
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
