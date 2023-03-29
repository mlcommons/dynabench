import React, { FC } from "react";
import ReactMarkdown from "react-markdown";

type OverviewTaskProps = {
  roundDescription: string;
  generalDescription: string;
};

const OverviewTask: FC<OverviewTaskProps> = ({
  roundDescription,
  generalDescription,
}) => {
  return (
    <>
      <h3 className="text-2xl font-bold text-letter-color">
        General Description
      </h3>
      <div className="mt-4 text-lg text-letter-color">
        <ReactMarkdown>{generalDescription}</ReactMarkdown>
      </div>
      <h3 className="text-2xl font-bold text-letter-color mt-4">
        Round Description
      </h3>
      <div
        className="mt-4 text-lg text-letter-color"
        dangerouslySetInnerHTML={{
          __html: roundDescription,
        }}
      ></div>
    </>
  );
};

export default OverviewTask;
