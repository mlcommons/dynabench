import React, { FC } from "react";
import { FormControl } from "react-bootstrap";
import { AnnotationComponentBaseProps } from "../../../types/createSamples/annotationComponentBase";

const StringsInterface: FC<AnnotationComponentBaseProps> = ({
  className,
  data,
  setData,
  name,
  configObj,
  inputReminder,
}) => {
  return (
    <>
      <div className={inputReminder ? "p-2 border rounded border-danger" : ""}>
        <FormControl
          className={"rounded-1 thick-border p-3 " + className}
          placeholder={configObj.placeholder}
          value={data[name] ? data[name] : ""}
          onChange={(event: any) => {
            data[name] = event.target.value;
            setData(data);
          }}
          required={true}
        />
      </div>
    </>
  );
};

export default StringsInterface;
