import React, { FC } from "react";

type DragAndDropProps = {
  disabled: boolean;
  name: string;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const DragAndDrop: FC<DragAndDropProps> = ({
  disabled,
  name,
  handleChange,
}) => {
  return (
    <>
      <div className="browse-wrap principal-color">
        <div>Drag & drop your files here</div>
        <input
          disabled={disabled}
          type="file"
          name={name}
          className="upload"
          title="Choose a file to upload"
          onChange={handleChange}
        />
      </div>
    </>
  );
};
export default DragAndDrop;
