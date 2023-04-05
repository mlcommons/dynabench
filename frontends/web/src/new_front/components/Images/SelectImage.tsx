import React, { FC, useState } from "react";

type SelectImageProps = {
  image: string;
  index: number;
  showCheck?: boolean;
  handleSelectImage: (image: string) => void;
};

const SelectImage: FC<SelectImageProps> = ({
  image,
  index,
  showCheck = true,
  handleSelectImage,
}) => {
  const [expandImage, setExpandImage] = useState<boolean>(false);

  const handleOnClicked = (image: string) => {
    handleSelectImage(image);
  };

  return (
    <div key={index} className="py-2 flex flex-col align-center items-center">
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
      ></img>
      <input
        id="checkbox"
        type="radio"
        value=""
        className={`${
          showCheck ? "block" : "hidden"
        } items-center w-4 h-4 px-6`}
        onClick={() => {
          handleOnClicked(image);
        }}
      />
    </div>
  );
};

export default SelectImage;
