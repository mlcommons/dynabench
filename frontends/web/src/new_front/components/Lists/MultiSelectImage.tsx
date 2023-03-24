import React, { FC, useState } from "react";
import SelectImage from "new_front/components/Images/SelectImage";
import { Collapse } from "react-bootstrap";

export type MultiSelectImageProps = {
  instructions?: string;
  images: string[];
  handleFunction: (value: any) => void;
};

const MultiSelectImage: FC<MultiSelectImageProps> = ({
  instructions,
  images,
  handleFunction,
}) => {
  const [open, setOpen] = useState(true);

  return (
    <>
      <div>
        {instructions && (
          <h3
            className="my-2 font-semibold text-letter-color pointer"
            onClick={() => setOpen(!open)}
          >
            {instructions} ↓
          </h3>
        )}
        <Collapse in={open}>
          <div className="grid grid-cols-3">
            {images.map((image, index) => (
              <div key={index} className="max-h-72">
                <SelectImage
                  image={image}
                  index={index}
                  handleSelectImage={handleFunction}
                />
              </div>
            ))}
          </div>
        </Collapse>
      </div>
    </>
  );
};

export default MultiSelectImage;
