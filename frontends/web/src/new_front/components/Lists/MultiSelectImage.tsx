import React, { FC, useEffect, useState } from "react";
import SelectImage from "new_front/components/Images/SelectImage";
import { Collapse } from "react-bootstrap";
import parse from "html-react-parser";
import Carousel from "react-grid-carousel";

export type MultiSelectImageProps = {
  instructions?: string;
  images: string[];
  selectedImage: string;
  handleFunction: (value: any) => void;
  isMobile?: boolean;
};

const MultiSelectImage: FC<MultiSelectImageProps> = ({
  instructions,
  images,
  handleFunction,
  selectedImage,
  isMobile,
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
            <h3 className="mt-4 text-base font-semibold normal-case md:mt-0 text-letter-color">
              {open ? (
                <i className="pl-2 pr-3 " />
              ) : (
                <i className="pl-2 pr-3 " />
              )}
              {parse(instructions)}
            </h3>
          </div>
        )}
        <Collapse in={open}>
          <Carousel
            rows={1}
            gap={10}
            showDots={true}
            mobileBreakpoint={0}
            cols={isMobile ? 1 : 3}
          >
            {images.map((image, index) => (
              <Carousel.Item key={index}>
                <div key={index} className="mt-10 md:mt-0 max-h-72">
                  <SelectImage
                    isSelected={selectedImage === image}
                    image={image}
                    index={index}
                    handleSelectImage={handleFunction}
                  />
                </div>
              </Carousel.Item>
            ))}
          </Carousel>
        </Collapse>
      </div>
    </>
  );
};

export default MultiSelectImage;
