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

  return (
    <div key={index}>
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
      <input
        id="checkbox"
        type="checkbox"
        value=""
        className="items-center"
        onClick={(e) => {
          handleSelectImage(image);
        }}
      />
    </div>
  );
};

export default SelectImage;
