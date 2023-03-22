import React, { FC, useState } from "react";

type SelectImageProps = {
  image: string;
  index: number;
  selectedImages: string[];
  handleSelectImages: (images: string[]) => void;
};

const SelectImages: FC<SelectImageProps> = ({
  image,
  index,
  selectedImages,
  handleSelectImages,
}) => {
  const [expandImage, setExpandImage] = useState<boolean>(false);

  const handleOnClicked = (image: string) => {
    if (selectedImages.includes(image)) {
      selectedImages.splice(selectedImages.indexOf(image), 1);
    } else {
      selectedImages.push(image);
    }
    console.log("selectedImages", selectedImages);
    handleSelectImages(selectedImages);
  };

  return (
    <div key={index}>
      <img
        height={240}
        width={240}
        src={`data:image/jpeg;base64,${image}`}
        onClick={() => {
          setExpandImage(!expandImage);
        }}
        className={expandImage ? "relative scale-[2.7] z-50 " : "scale-[1]"}
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

export default SelectImages;
