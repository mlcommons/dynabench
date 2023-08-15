import React from "react";

type ZoomImageProps = {
  image: string;
};

const ZoomImage = ({ image }: ZoomImageProps) => {
  return (
    <div>
      <img
        height={2400}
        width={2400}
        src={`data:image/jpeg;base64,${image}`}
        alt="src"
        className="cursor-pointer rounded-lg object-contain"
      />
    </div>
  );
};

export default ZoomImage;
