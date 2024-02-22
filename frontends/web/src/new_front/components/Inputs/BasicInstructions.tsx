import React from "react";

const BasicInstructions = ({ instructions }: any) => {
  return (
    <div className="flex flex-col items-start justify-center pt-8">
      <h1 className="text-2xl font-bold">{instructions.title}</h1>
      <p className="pt-3 text-lg">{instructions.description}</p>
      <h4 className="pt-3 text-xl font-bold">{instructions.subtitle}</h4>
      <p className="pt-3 text-lg">{instructions.specific_description}</p>
    </div>
  );
};

export default BasicInstructions;
