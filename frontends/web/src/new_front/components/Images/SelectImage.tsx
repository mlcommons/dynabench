import React, { FC, useState } from "react";

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
  const [expandImage, setExpandImage] = useState<boolean>(false);

  const handleOnClicked = (image: string) => {
    handleSelectImage(image);
  };

  return (
    <div key={index} className="flex flex-col items-center py-2 align-center">
      <img
        height={240}
        width={240}
        src={`data:image/jpeg;base64,${image}`}
        onClick={() => {
          setExpandImage(!expandImage);
        }}
        className={`${
          expandImage
            ? "relative scale-[2.7] z-50 rounded-lg"
            : "scale-[1] rounded-lg"
        } pb-2`}
        alt="src"
      />
      <input
        id="checkbox"
        type="radio"
        name="image"
        value=""
        checked={isSelected}
        className={`items-center w-4 h-4 px-6`}
        onClick={() => {
          handleOnClicked(image);
        }}
      />
    </div>
  );
};

export default SelectImage;
