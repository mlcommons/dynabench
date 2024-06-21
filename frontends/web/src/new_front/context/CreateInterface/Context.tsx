import React, { createContext, useState, FC } from "react";
import { set } from "react-ga";
import useFetch from "use-http";

interface CreateInterfaceContextType {
  modelInputs: Record<string, any>;
  metadataExample: Record<string, any>;
  updateModelInputs: (input: object, metadata?: boolean) => void;
  amountExamplesCreatedToday: number;
  updateAmountExamplesCreatedToday: (realRoundId: number, userId: number) => void;
  removeItem: (key: string) => void;
}

export const CreateInterfaceContext = createContext<CreateInterfaceContextType>({
  modelInputs: {},
  metadataExample: {},
  updateModelInputs: () => {},
  amountExamplesCreatedToday: 0,
  updateAmountExamplesCreatedToday: () => {},
  removeItem: () => {},
});

type CreateInterfaceProviderProps = {
  children: React.ReactNode;
};

export const CreateInterfaceProvider: FC<CreateInterfaceProviderProps> = ({
  children,
}) => {
  const [modelInputs, setModelInputs] = useState<Record<string, any>>({});
  const [metadataExample, setMetadataExample] = useState({});
  const [amountExamplesCreatedToday, setAmountExamplesCreatedToday] =
    useState(0);
  const { get, post, response, loading } = useFetch();

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

  const updateAmountExamplesCreatedToday = async (
    realRoundId: number,
    userId: number,
  ) => {
    const amountExamples = await post(
      `/rounduserexample/number_of_examples_created`,
      {
        round_id: realRoundId,
        user_id: userId,
      },
    );
    if (response.ok) {
      setAmountExamplesCreatedToday(amountExamples);
    }
  };

  const removeItem = (key: string) => {
    setModelInputs((prevModelInputs) => {
      const {[key]: _, ...newObject} = prevModelInputs
      return newObject;
    });
  }

  return (
    <CreateInterfaceContext.Provider
      value={{
        modelInputs,
        metadataExample,
        updateModelInputs,
        amountExamplesCreatedToday,
        updateAmountExamplesCreatedToday,
        removeItem,
      }}
    >
      {children}
    </CreateInterfaceContext.Provider>
  );
};
