import React, { FC, useState } from "react";

type SelectImageProps = {
  image: string;
  index: number;
  selectedImages: string[];
  setSelectedImages: (images: string[]) => void;
  handleSelectImages: (images: string[]) => void;
};

const SelectImages: FC<SelectImageProps> = ({
  image,
  index,
  selectedImages,
  setSelectedImages,
}) => {
  const [expandImage, setExpandImage] = useState<boolean>(false);

  const handleOnClicked = (image: string) => {
    if (selectedImages.includes(image)) {
      const index = selectedImages.indexOf(image);
      if (index > -1) {
        selectedImages.splice(index, 1);
      }
    } else {
      selectedImages.push(image);
    }
    setSelectedImages(selectedImages);
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
        className={
          expandImage
            ? "relative scale-[2.7] z-50 rounded-lg"
            : "scale-[1] rounded-lg pb-2"
        }
        alt="src"
      ></img>
      <div>
        <input
          id="checkbox"
          type="checkbox"
          value=""
          className="items-center w-4 h-4 px-6"
          onClick={() => {
            handleOnClicked(image);
          }}
        />
      </div>
    </div>
  );
};

export default SelectImages;
