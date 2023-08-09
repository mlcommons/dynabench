import React, { FC, useState } from "react";
import { forbidden_image, black_image } from "new_front/utils/constants";
import Zoom from "react-img-zoom";

type SelectImageProps = {
  image: string;
  index: number;
  isSelected: boolean;
  handleSelectImage: (image: string) => void;
};

const SelectImage: FC<SelectImageProps> = ({
  image,
  index,
  handleSelectImage,
  isSelected,
}) => {
  const handleOnClicked = (image: string) => {
    handleSelectImage(image);
  };

  return (
    <div
      key={index}
      className="flex flex-col items-center py-2 space-y-4 align-center"
    >
      <Zoom
        height={240}
        width={300}
        img={`data:image/jpeg;base64,${image}`}
        className={`scale-[1] rounded-lg pb-4`}
        zoomScale={1.9}
      />
      {!image.startsWith(forbidden_image) && !image.startsWith(black_image) && (
        <input
          id="checkbox"
          type="radio"
          name="image"
          value=""
          defaultChecked={isSelected}
          className={`items-center w-4 h-4 px-6 py-2`}
          onChange={() => {
            handleOnClicked(image);
          }}
        />
      )}
    </div>
  );
};

export default SelectImage;
