import React, { FC } from "react";
import { AnnotationComponentProps } from "../../types/createSamples/annotationComponent";
import { StringsInterface } from "./AnnotationComponents";

const AnnotationComponet: FC<AnnotationComponentProps> = ({
  displayName,
  className,
  create,
  data,
  setData,
  name,
  configObj,
  showName = true,
  inputReminder = false,
  strategyAnnotation,
}) => {
  return (
    <>
      {create ? (
        <StringsInterface
          className={className}
          data={data}
          setData={setData}
          name={name}
          configObj={configObj}
          inputReminder={inputReminder}
          strategyAnnotation={strategyAnnotation}
        />
      ) : (
        <>
          {showName && (
            <h6 className={"spaced-header " + className}>
              {displayName ? displayName : name}:
            </h6>
          )}
          {data[name].join(", ")}
        </>
      )}
    </>
  );
};

export default AnnotationComponet;
