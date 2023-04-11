import React, { FC, useState } from "react";
import SelectImage from "new_front/components/Images/SelectImage";
import { Collapse } from "react-bootstrap";
import parse from "html-react-parser";

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
              {parse(instructions)}
            </h3>
          </div>
        )}
        <Collapse in={open}>
          <div className={`grid grid-cols-3 justify-center`}>
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
