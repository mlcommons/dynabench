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
          <div
            className="flex items-center h-16 px-1 space-x-10 transition cursor-pointer hover:bg-[#eef2ff]"
            onClick={() => setOpen(!open)}
          >
            <h3 className="mb-1 text-base font-semibold normal-case text-letter-color">
              {open ? (
                <i className="pl-2 pr-3 fas fa-minus" />
              ) : (
                <i className="pl-2 pr-3 fas fa-plus" />
              )}
              {instructions}
            </h3>
          </div>
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
