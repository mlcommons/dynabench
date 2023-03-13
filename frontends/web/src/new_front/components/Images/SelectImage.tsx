import React, { FC, useState } from "react";

type SelectImageProps = {
  image: string;
  index: number;
  setSelectImage: (image: string) => void;
};

const SelectImage: FC<SelectImageProps> = ({
  image,
  index,
  setSelectImage,
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
        className={expandImage ? "scale-[2.7]" : "scale-[1]"}
        alt="src"
      ></img>
      <input
        id="checkbox"
        type="checkbox"
        value=""
        className="items-center"
        onClick={() => {
          setSelectImage(image);
        }}
      />
    </div>
  );
};

export default SelectImage;
