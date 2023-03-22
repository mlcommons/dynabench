import { ContextConfigType } from "new_front/types/createSamples/createSamples/annotationContext";
import { ContextAnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import React, { FC, useState } from "react";
import { StringDiff, DiffMethod } from "react-string-diff";

const ModifyOriginalText: FC<ContextAnnotationFactoryType & ContextConfigType> =
  ({ context }) => {
    const initValue = context.context;

    const [newValue, setNewValue] = useState(initValue);

    return (
      <>
        <div>
          <div>
            <h3 className="p-2 text-lg">
              {" "}
              <strong>Question:</strong> {context.question}
            </h3>
            {context.answers.text.length > 0 && (
              <h3 className="p-2 text-lg">
                <strong>Answer:</strong> {context.answers.text[0]}
              </h3>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 py-4">
            <textarea value={initValue} className="p-4 h-72" />
            <textarea
              onChange={({ target: { value } }) => setNewValue(value)}
              value={newValue}
              className="p-4 h-72"
            />
          </div>

          <h6 className="pb-2 text-base font-bold">Difference: </h6>
          <StringDiff
            newValue={newValue}
            oldValue={initValue}
            method={DiffMethod.WordsWithSpace}
          />
        </div>
      </>
    );
  };

export default ModifyOriginalText;
