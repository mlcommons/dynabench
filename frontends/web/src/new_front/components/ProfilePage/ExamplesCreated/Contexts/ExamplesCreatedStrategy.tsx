import { ExamplesCreatedContext } from "new_front/types/profilePage/examplesCreated/examplesCreatedContext";
import { ExamplesCreatedFactoryType } from "new_front/types/profilePage/examplesCreated/examplesCreatedFactory";
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
): LazyExoticComponent<ComponentType<ExamplesCreatedFactoryType>> =>
  React.lazy(() => import(`./${module}`).catch(() => import(`./GoalFallback`)));

type Props = {
  config: ExamplesCreatedContext[];
  infoExampleToValidate: any;
};

const ExamplesCreatedStrategy: FC<Props & ExamplesCreatedFactoryType> = ({
  config,
  infoExampleToValidate,
}) => {
  const [contextRenders, setContextRenders] = useState<
    ReactElement<ExamplesCreatedContext & ExamplesCreatedFactoryType>[]
  >([]);

  useEffect(() => {
    const getView = () => {
      config.map((option, index) => {
        option = { ...option, info: infoExampleToValidate[option?.label!] };
        const View = Import(ModulesRegistry.context[option.type]);
        setContextRenders((prev) => [
          ...prev,
          <View {...{ infoExampleToValidate, ...option }} key={index} />,
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

export default ExamplesCreatedStrategy;
