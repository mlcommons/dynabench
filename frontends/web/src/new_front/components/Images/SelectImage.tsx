import React, { FC, useState } from "react";
import { forbidden_image, black_image } from "new_front/utils/constants";
import Zoom from "react-medium-image-zoom";

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
  const [expandImage, setExpandImage] = useState(false);

  return (
    <div key={index} className="flex flex-col items-center py-2 align-center">
      <img
        height={240}
        width={240}
        src={`data:image/jpeg;base64,${image}`}
        onClick={() => {
          setExpandImage(!expandImage);
        }}
        alt="src"
      />
      {!image.startsWith(forbidden_image) && !image.startsWith(black_image) && (
        <input
          id="checkbox"
          type="radio"
          name="image"
          value=""
          defaultChecked={isSelected}
          className={`items-center w-4 h-4 px-6`}
          onChange={() => {
            handleOnClicked(image);
          }}
        />
      )}
    </div>
  );
};

export default SelectImage;
