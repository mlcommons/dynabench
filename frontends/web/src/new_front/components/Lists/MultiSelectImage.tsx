import React, { FC } from "react";
import SelectImage from "new_front/components/Images/SelectImage";

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
  return (
    <>
      {instructions && (
        <h3 className="mb-1 font-semibold text-gray-900 ">{instructions}</h3>
      )}
      {images.map((image, index) => (
        <div key={index}>
          <SelectImage
            image={image}
            index={index}
            handleSelectImage={handleFunction}
          />
        </div>
      ))}
    </>
  );
};

export default MultiSelectImage;
