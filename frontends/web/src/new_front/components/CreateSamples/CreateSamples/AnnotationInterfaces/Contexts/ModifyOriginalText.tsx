import { ContextConfigType } from "new_front/types/createSamples/annotationContext";
import { ContextAnnotationFactoryType } from "new_front/types/createSamples/annotationFactory";
import React, { FC, useState } from "react";
import { StringDiff } from "react-string-diff";

const ModifyOriginalText: FC<ContextAnnotationFactoryType & ContextConfigType> =
  ({ context }) => {
    const initValue = context.context;

    const [newValue, setNewValue] = useState(initValue);

    return (
      <>
        <div>
          <div>
            <p>Question: {context.question}</p>
            <p>Answer: {context.answer}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 py-4">
            <textarea value={initValue} className="p-4 h-72" />
            <textarea
              onChange={({ target: { value } }) => setNewValue(value)}
              value={newValue}
              className="p-4 h-72"
            />
          </div>

          <h6>Difference: </h6>
          <StringDiff newValue={initValue} oldValue={newValue} />

          <input></input>
        </div>
      </>
    );
  };

export default ModifyOriginalText;
