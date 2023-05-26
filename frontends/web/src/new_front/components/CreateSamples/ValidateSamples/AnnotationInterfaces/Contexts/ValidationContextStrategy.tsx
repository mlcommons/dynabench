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
  infoExampleToValidate: any;
};

const ValidationContextStrategy: FC<Props & ValidationFactoryType> = ({
  config,
  task,
  infoExampleToValidate,
  onInputChange,
}) => {
  const [contextRenders, setContextRenders] = useState<
    ReactElement<ValidationContext & ValidationFactoryType>[]
  >([]);

  useEffect(() => {
    const getView = () => {
      config.map((option, index) => {
        option = { ...option, info: infoExampleToValidate[option?.label!] };
        const View = Import(ModulesRegistry.context[option.type]);
        setContextRenders((prev) => [
          ...prev,
          <View
            {...{ onInputChange, task, infoExampleToValidate, ...option }}
            key={index}
          />,
        ]);
      });
    };
    getView();
    console.log("contextRenders", contextRenders);
    console.log("config", config);
    console.log("infoExampleToValidate", infoExampleToValidate);
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
