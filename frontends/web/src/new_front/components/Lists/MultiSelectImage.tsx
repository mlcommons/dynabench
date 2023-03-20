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
  console.log("images", images);

  return (
    <>
      <div>
        {instructions && (
          <h3 className="mb-1 font-semibold text-gray-900 ">{instructions}</h3>
        )}
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
      </div>
    </>
  );
};

export default MultiSelectImage;
