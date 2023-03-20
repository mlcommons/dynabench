import React, { FC } from "react";
import SelectImages from "new_front/components/Images/SelectImages";

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

  return (
    <>
      <div>
        {instructions && (
          <h3 className="mb-1 font-semibold text-gray-900 ">{instructions}</h3>
        )}
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
      </div>
    </>
  );
};

export default MultiSelectImages;
