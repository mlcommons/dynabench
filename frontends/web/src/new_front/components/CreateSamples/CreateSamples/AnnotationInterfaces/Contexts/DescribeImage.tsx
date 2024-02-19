import GeneralButton from "new_front/components/Buttons/GeneralButton";
import BasicInput from "new_front/components/Inputs/BasicInput";
import React, { useState } from "react";

type ImageUploadProps = {
  setImage: (image: string) => void;
};

const ImageUpload = ({ setImage }: ImageUploadProps) => {
  const handleImageChange = (e: any) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex justify-center align-center">
      <div className="flex flex-col items-center py-2 space-y-3 align-center">
        <input type="file" accept="image/*" onChange={handleImageChange} />
      </div>
    </div>
  );
};

const DescribeImage = () => {
  const [image, setImage] = useState<string>(
    "https://w7.pngwing.com/pngs/527/625/png-transparent-scalable-graphics-computer-icons-upload-uploading-cdr-angle-text-thumbnail.png",
  );
  const [description, setDescription] = useState<string>("");

  return (
    <div className="flex justify-center align-center">
      <div className="flex flex-col items-center py-2 space-y-3 align-center">
        <img
          height={640}
          width={640}
          src={image}
          alt="src"
          className="rounded-lg cursor-pointer"
        />
        <ImageUpload setImage={setImage} />
        <BasicInput
          placeholder="Enter text here. Do not copy and paste"
          onChange={(e) => setDescription(e.target.value)}
        />
        <GeneralButton
          onClick={() => console.log(description)}
          text="Send"
          className="px-4 mt-[2px] font-semibold border-0 font-weight-bold light-gray-bg task-action-btn "
        />
      </div>
    </div>
  );
};

export default DescribeImage;
