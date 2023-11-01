import { PieRechart } from "components/Charts/Rechart";
import { ModelOutputType } from "new_front/types/createSamples/createSamples/modelOutput";
import React, { FC } from "react";

const ResponseInfo: FC<ModelOutputType> = ({
  label,
  input,
  prediction,
  probabilities,
  fooled,
  sandBox,
  isGenerativeContext,
}) => {
  return (
    <>
      {!isGenerativeContext && (
        <div className="rounded border m-3 bg-[#e9ffe8]">
          <div className="grid grid-cols-12">
            <div className="col-span-9">
              <div id="foolModel" className="p-2 font-bold">
                {fooled ? (
                  <span>You fooled the model!</span>
                ) : (
                  <span> You didn't fool the model. Please try again!</span>
                )}
              </div>
              <div id="inputByUser" className="p-2 font-bold">
                {input}
              </div>
              <div id="comparinWithModel" className="p-2">
                <p>
                  The model predicted <strong>{prediction}</strong> and you say{" "}
                  <strong>{label}</strong>
                </p>
              </div>
              <div id="sandBox" className="p-2">
                {sandBox ? (
                  <span>
                    This example was not stored because you are in sandbox mode.
                    Sign up now to make sure your examples are stored and you
                    get credit for your examples!
                  </span>
                ) : (
                  <span>
                    You are not in sandbox mode. Your submission will be saved.
                  </span>
                )}
              </div>
            </div>
            <div className="col-span-3 p-4">
              {probabilities && (
                <PieRechart
                  data={Object.values(probabilities as any)}
                  labels={Object.keys(probabilities as any)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ResponseInfo;
