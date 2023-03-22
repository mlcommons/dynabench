import React, { FC, useState } from "react";
import SelectImages from "new_front/components/Images/SelectImages";
import { Collapse } from "react-bootstrap";

export type MultiSelectImagesProps = {
  instructions?: string;
  images: string[];
  handleFunction: (value: any) => void;
};

const MultiSelectImages: FC<MultiSelectImagesProps> = ({
  instructions,
  images,
  handleFunction,
}) => {
  const selectedImages: string[] = [];
  const [open, setOpen] = useState(true);

  return (
    <>
      <div>
        {instructions && (
          <h3
            className="mb-1 font-semibold text-letter-color pointer"
            onClick={() => setOpen(!open)}
          >
            {instructions} ↆ
          </h3>
        )}
        <Collapse in={open}>
          <div className="grid grid-cols-3">
            {images.map((image, index) => (
              <div key={index} className="max-h-72">
                <SelectImages
                  image={image}
                  index={index}
                  selectedImages={selectedImages}
                  handleSelectImages={handleFunction}
                />
              </div>
            ))}
          </div>
        </Collapse>
      </div>
    </>
  );
};

export default MultiSelectImages;
