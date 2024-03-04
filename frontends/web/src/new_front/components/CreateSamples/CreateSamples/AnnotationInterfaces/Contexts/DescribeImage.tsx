import GeneralButton from "new_front/components/Buttons/GeneralButton";
import BasicInput from "new_front/components/Inputs/BasicInput";
import { ContextConfigType } from "new_front/types/createSamples/createSamples/annotationContext";
import { ContextAnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import React, { FC, useContext, useState } from "react";
import DoubleDropDown from "new_front/components/Inputs/DoubleDropDown";
import useFetch from "use-http";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";

type ImageUploadProps = {
  setImage: (image: string) => void;
};

const ImageUpload = ({ setImage }: ImageUploadProps) => {
  const [dragging, setDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      className={`flex justify-center items-center border-2 border-dashed rounded-lg p-4 ${
        dragging ? "bg-gray-200" : ""
      }`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageChange}
      />
      <div className="text-center">
        <p className="mb-2">Drag & Drop or Click to Upload Image</p>
        <button
          className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
          onClick={() => document.getElementById("fileInput")?.click()}
        >
          Select Image
        </button>
      </div>
    </div>
  );
};

const DescribeImage: FC<ContextAnnotationFactoryType & ContextConfigType> = ({
  taskId,
  generative_context,
  setIsGenerativeContext,
}) => {
  const [filterContext, setFilterContext] = useState<any>({
    language: "spanish",
    country: "spain",
    categories: [
      {
        name: "Food and beverages",
        concepts: [
          "Tortilla de patatas",
          "Paella",
          "Fabada",
          "Gazpacho",
          "Pulpo a la gallega",
          "Migas",
          "Horchata de chufa",
          "Salmorejo",
          "Sidra",
        ],
      },
      {
        name: "Buildings",
        concepts: ["Iglesia", "Catedral", "Monasterio"],
      },
    ],
  });
  const [image, setImage] = useState(
    "https://w7.pngwing.com/pngs/527/625/png-transparent-scalable-graphics-computer-icons-upload-uploading-cdr-angle-text-thumbnail.png",
  );
  const [description, setDescription] = useState("");
  const { post, response } = useFetch();
  const { modelInputs } = useContext(CreateInterfaceContext);

  const getFilterContext = () => {
    const filterContext = post("/task/get_filter_context", {
      task_id: taskId,
      filter: [
        {
          name: "language",
          //  @ts-ignore
          value: modelInputs.origin_secondary
            ? modelInputs.origin_secondary
            : "en",
        },
      ],
    });
    if (response.ok) {
      setFilterContext(filterContext);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-3 divide-x-2">
      <div className="col-span-1">
        <div className="flex flex-col items-center py-2 space-y-3 align-center">
          <DoubleDropDown filterContext={filterContext} />
        </div>
      </div>
      <div className="col-span-2 px-4">
        <div className="flex flex-col items-center w-full col-span-2 py-2 space-y-3 align-center">
          <img
            height={200}
            width={200}
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
    </div>
  );
};

export default DescribeImage;
