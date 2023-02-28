import React, { FC } from "react";

const ValidateSamples: FC = () => {
  const responseModel = {
    cid: 1,
    context: {
      context_json:
        '{"context": "Please pretend you are reviewing a restaurant, movie, or book."}',
      last_used: "2023-02-23T17:13:17",
    },
    input_json: {
      context: "Please pretend you are reviewing a restaurant, movie, or book.",
      label: "entailed",
    },
    flagged: false,
  };

  return <div>ValidateSamples</div>;
};

export default ValidateSamples;
