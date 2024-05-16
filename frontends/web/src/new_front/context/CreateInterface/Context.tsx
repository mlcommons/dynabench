import React, { createContext, useState, FC } from "react";
import useFetch from "use-http";

export const CreateInterfaceContext = createContext({
  modelInputs: {},
  metadataExample: {},
  updateModelInputs: (input: object, metadata?: boolean) => {},
  amountExamplesCreatedToday: 0,
  updateAmountExamplesCreatedToday: (realRoundId: number, userId: number) => {},
});

type CreateInterfaceProviderProps = {
  children: React.ReactNode;
};

export const CreateInterfaceProvider: FC<CreateInterfaceProviderProps> = ({
  children,
}) => {
  const [modelInputs, setModelInputs] = useState({});
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

  return (
    <CreateInterfaceContext.Provider
      value={{
        modelInputs,
        metadataExample,
        updateModelInputs,
        amountExamplesCreatedToday,
        updateAmountExamplesCreatedToday,
      }}
    >
      {children}
    </CreateInterfaceContext.Provider>
  );
};
