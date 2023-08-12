import React, { createContext, useState, FC } from "react";

export const CreateInterfaceContext = createContext({
  modelInputs: {},
  metadataExample: {},
  updateModelInputs: (input: object, metadata?: boolean) => {},
});

type CreateInterfaceProviderProps = {
  children: React.ReactNode;
};

export const CreateInterfaceProvider: FC<CreateInterfaceProviderProps> = ({
  children,
}) => {
  const [modelInputs, setModelInputs] = useState({});
  const [metadataExample, setMetadataExample] = useState({});

  const updateModelInputs = (input: object, metadata?: boolean) => {
    if (!metadata) {
      setModelInputs((prevModelInputs) => {
        return { ...prevModelInputs, ...input };
      });
    } else {
      setMetadataExample((prevModelInputs) => {
        console.log("input", input);

        return { ...prevModelInputs, ...input };
      });
    }
  };

  return (
    <CreateInterfaceContext.Provider
      value={{ modelInputs, metadataExample, updateModelInputs }}
    >
      {children}
    </CreateInterfaceContext.Provider>
  );
};
