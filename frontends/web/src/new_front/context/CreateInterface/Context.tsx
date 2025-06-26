import React, { createContext, useState, FC } from "react";
import useFetch from "use-http";

interface CreateInterfaceContextType {
  modelInputs: Record<string, any>;
  metadataExample: Record<string, any>;
  updateModelInputs: (input: object, metadata?: boolean) => void;
  cleanModelInputs: () => void;
  amountExamplesCreatedToday: number;
  updateAmountExamplesCreatedToday: (
    realRoundId: number,
    userId: number,
  ) => void;
  removeItem: (key: string) => void;
}

export const CreateInterfaceContext = createContext<CreateInterfaceContextType>(
  {
    modelInputs: {},
    metadataExample: {},
    updateModelInputs: () => {},
    cleanModelInputs: () => {},
    amountExamplesCreatedToday: 0,
    updateAmountExamplesCreatedToday: () => {},
    removeItem: () => {},
  },
);

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

  const cleanModelInputs = () => {
    setModelInputs({});
  };

  const updateAmountExamplesCreatedToday = async (
    realRoundId: number,
    userId: number,
  ) => {
    fetch(
      `${process.env.REACT_APP_API_HOST_2}/rounduserexample/number_of_examples_created`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          round_id: realRoundId,
          user_id: userId,
        }),
      },
    )
      .then((response) => response.json())
      .then((data) => {
        data && setAmountExamplesCreatedToday(data);
      });
  };

  const removeItem = (key: string) => {
    setModelInputs((prevModelInputs) => {
      const { [key]: _, ...newObject } = prevModelInputs;
      return newObject;
    });
  };

  return (
    <CreateInterfaceContext.Provider
      value={{
        modelInputs,
        metadataExample,
        updateModelInputs,
        cleanModelInputs,
        amountExamplesCreatedToday,
        updateAmountExamplesCreatedToday,
        removeItem,
      }}
    >
      {children}
    </CreateInterfaceContext.Provider>
  );
};
