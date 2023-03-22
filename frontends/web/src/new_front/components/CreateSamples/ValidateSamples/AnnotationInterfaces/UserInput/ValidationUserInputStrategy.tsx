import { ValidationFactoryType } from "new_front/types/createSamples/validateSamples/validationFactory";
import { ValidationUserInput } from "new_front/types/createSamples/validateSamples/validationUserInputs";
import ModulesRegistry from "new_front/utils/validation_interface_options.json";
import React, {
  FC,
  ReactElement,
  useEffect,
  useState,
  Suspense,
  ComponentType,
  LazyExoticComponent,
} from "react";
import { BarLoader } from "react-spinners";

const Import = (
  module: string
): LazyExoticComponent<ComponentType<ValidationFactoryType>> =>
  React.lazy(() => import(`./${module}`).catch(() => import(`./GoalFallback`)));

type Props = {
  config: ValidationUserInput[];
};

const ValidationUserInputStrategy: FC<Props & ValidationFactoryType> = ({
  config,
  task,
  onInputChange,
}) => {
  const [userRenders, setUserRenders] = useState<
    ReactElement<ValidationUserInput & ValidationFactoryType>[]
  >([]);

  useEffect(() => {
    const getView = () => {
      config.map((option, index) => {
        const View = Import(ModulesRegistry.user_input[option.type]);
        setUserRenders((prev) => [
          ...prev,
          <View {...{ onInputChange, task, ...option }} key={index} />,
        ]);
      });
    };
    getView();
  }, []);

  return (
    <>
      <Suspense fallback={<BarLoader color="#ccebd4" />}>
        {userRenders}
      </Suspense>
    </>
  );
};

export default ValidationUserInputStrategy;
