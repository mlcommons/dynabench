import React, { createContext, useState, FC } from "react";

export const CreateInterfaceContext = createContext({
  modelInputs: {},
  metadataExample: {},
  updateModelInputs: (input: object, metadata?: boolean) => {},
});

export const CreateInterfaceProvider: FC = ({ children }) => {
  const [modelInputs, setModelInputs] = useState({});
  const [metadataExample, setMetadataExample] = useState({});

  const updateModelInputs = (input: object, metadata?: boolean) => {
    if (!metadata) {
      setModelInputs((prevModelInputs) => {
        return { ...prevModelInputs, ...input };
      });
    } else {
      setMetadataExample((prevModelInputs) => {
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
