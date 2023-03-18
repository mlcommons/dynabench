import React, { FC, useState } from "react";

type SelectImageProps = {
  image: string;
  index: number;
  handleSelectImage: (image: string) => void;
};

const SelectImage: FC<SelectImageProps> = ({
  image,
  index,
  handleSelectImage,
}) => {
  const [expandImage, setExpandImage] = useState<boolean>(false);

  const handleOnClicked = (image: string) => {
    handleSelectImage(image);
  };

  return (
    <div key={index} className="grid grid-flow-col grid-rows-2 gap-2">
      <img
        height={240}
        width={240}
        src={`data:image/jpeg;base64,${image}`}
        onClick={() => {
          setExpandImage(!expandImage);
        }}
        className={expandImage ? "relative scale-[2.7] z-50" : "scale-[1]"}
        alt="src"
      ></img>
      <div>
        <input
          id="checkbox"
          type="checkbox"
          value=""
          className="items-center"
          onClick={() => {
            handleOnClicked(image);
          }}
        />
      </div>
    </div>
  );
};

export default SelectImage;
