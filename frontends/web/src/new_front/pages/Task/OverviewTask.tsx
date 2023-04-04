import React, { FC } from "react";
import MDEditor from "@uiw/react-md-editor";

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
      <div className="border  px-4">
        <h3 className="text-2xl font-bold text-letter-color mt-4">
          General Description
        </h3>
        <div
          data-color-mode="light"
          className="mt-4 text-lg text-letter-color font-normal	"
        >
          <MDEditor.Markdown source={generalDescription} />
        </div>
        <h3 className="text-2xl font-bold text-letter-color mt-4 mb-4">
          Round Description
        </h3>
        <div
          className="mt-4 text-base text-letter-color mb-16"
          dangerouslySetInnerHTML={{
            __html: roundDescription,
          }}
        ></div>
      </div>
    </>
  );
};

export default OverviewTask;
