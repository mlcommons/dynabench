import SelectOptionWithSlider from "new_front/components/Inputs/SelectOptionWithSlider";
import React from "react";

const Test = () => {
  const options = [
    {
      label: "Call 999 (This is an emergency)",
    },
    {
      label: "Call your GP (This requires follow-up)",
    },
    {
      label: "Call 111 (This is urgent)",
    },
    {
      label: "Treat at home (This will resolve itself)",
    },
  ];

  const instructions =
    "Please select the most appropriate option for the given situation.";
  const field_name_for_the_model = "emergency_response";

  return (
    <>
      <SelectOptionWithSlider
        options={options}
        instructions={instructions}
        optionsSlider={["0", "100"]}
        field_name_for_the_model={field_name_for_the_model}
        onInputChange={(data: any, metadata?: boolean) => console.log(data)}
      />
    </>
  );
};

export default Test;
