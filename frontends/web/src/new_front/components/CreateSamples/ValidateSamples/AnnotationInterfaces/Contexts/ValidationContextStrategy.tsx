import { ValidationContext } from "new_front/types/createSamples/validateSamples/validationContext";
import { ValidationFactoryType } from "new_front/types/createSamples/validateSamples/validationFactory";
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
  config: ValidationContext[];
  responseModel: any;
};

const ValidationContextStrategy: FC<Props & ValidationFactoryType> = ({
  config,
  task,
  responseModel,
  onInputChange,
}) => {
  const [contextRenders, setContextRenders] = useState<
    ReactElement<ValidationContext & ValidationFactoryType>[]
  >([]);

  useEffect(() => {
    const getView = () => {
      config.map((option, index) => {
        option = { ...option, info: responseModel[option?.label!] };
        const View = Import(ModulesRegistry.context[option.type]);
        setContextRenders((prev) => [
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
        {contextRenders}
      </Suspense>
    </>
  );
};

export default ValidationContextStrategy;
