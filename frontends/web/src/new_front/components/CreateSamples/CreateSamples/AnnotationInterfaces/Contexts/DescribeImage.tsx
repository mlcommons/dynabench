import React, { FC, useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { PacmanLoader } from "react-spinners";
import MDEditor from "@uiw/react-md-editor";
import { Modal } from "react-bootstrap";
import Select from "react-select";
import useFetch from "use-http";
import axios from "axios";

import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import {
  updateCountry,
  updatelanguage,
  resetCategoryAndConcept,
  resetAllButCountry,
} from "state/wonders/wondersSlice";
import { RootState } from "state/store";

import GeneralButton from "new_front/components/Buttons/GeneralButton";
import DoubleDropDown from "new_front/components/Inputs/DoubleDropDown";
import { ContextConfigType } from "new_front/types/createSamples/createSamples/annotationContext";
import { ContextAnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";

type ImageUploadProps = {
  image: string;
  setFile: (file: File) => void;
  setImage: (image: string) => void;
  updateModelInputs: (input: object, metadata?: boolean) => void;
  letMagnifier?: boolean;
};

const ImageUpload = ({
  image,
  setFile,
  setImage,
  updateModelInputs,
  letMagnifier,
}: ImageUploadProps) => {
  const [dragging, setDragging] = useState(false);
  const magnifierHeight = 200;
  const magnifieWidth = 200;
  const zoomLevel = 1.5;
  const [imgWidth, setImgWidth] = useState(0);
  const [imgHeight, setImgHeight] = useState(0);
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [[x, y], setXY] = useState([0, 0]);

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
      updateModelInputs({ image: file.name });
      setFile(file);
    }
  };

  const handleMouseEnter = (e: any) => {
    const elem = e.currentTarget;
    const { width, height } = elem.getBoundingClientRect();
    setImgWidth(width);
    setImgHeight(height);
    setShowMagnifier(true);
  };

  const handleMouseMove = (e: any) => {
    const elem = e.currentTarget;
    const { top, left } = elem.getBoundingClientRect();
    const x = e.pageX - left - window.scrollX;
    const y = e.pageY - top - window.scrollY;
    setXY([x, y]);
  };

  return (
    <div>
      <div className="flex relative items-center justify-center object-cover max-w-full max-h-96 gap-8 pb-2">
        <img
          src={image}
          alt="src"
          className="rounded-lg w-full object-scale-down max-w-full max-h-96"
          onDrag={handleDragEnter}
          onDragEnd={handleDragLeave}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragEnter}
          onDrop={handleDrop}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setShowMagnifier(false)}
          onClick={() => {
            const input = document.getElementById("fileInput");
            if (input) {
              input.click();
            }
          }}
        />
        {letMagnifier && showMagnifier && (
          <div
            className="absolute pointer-events-none border border-gray-200 bg-white"
            style={{
              height: `${magnifierHeight}px`,
              width: `${magnifieWidth}px`,
              top: `${y - magnifierHeight / 2}px`,
              left: `${x - magnifieWidth / 2}px`,
              backgroundImage: `url('${image}')`,
              backgroundSize: `${imgWidth * zoomLevel}px ${
                imgHeight * zoomLevel
              }px`,
              backgroundPositionX: `${-x * zoomLevel + magnifieWidth / 2}px`,
              backgroundPositionY: `${-y * zoomLevel + magnifierHeight / 2}px`,
              backgroundRepeat: "no-repeat",
            }}
          />
        )}
      </div>
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
          id="fileInput"
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
    </div>
  );
};

const DescribeImage: FC<ContextAnnotationFactoryType & ContextConfigType> = ({
  taskId,
  setIsGenerativeContext,
  generative_context,
}) => {
  const BASE_URL_2 = process.env.REACT_APP_API_HOST_2;
  const { post, response, loading } = useFetch();
  const dispatch = useDispatch();
  const { updateModelInputs } = useContext(CreateInterfaceContext);
  const country = useSelector((state: RootState) => state.wonders.country);
  const language = useSelector((state: RootState) => state.wonders.language);
  const selectedCategory = useSelector(
    (state: RootState) => state.wonders.selectedCategory
  );
  const selectedConcept = useSelector(
    (state: RootState) => state.wonders.selectedConcept
  );

  const [filterContext, setFilterContext] = useState<any>();
  const [image, setImage] = useState(
    "https://w7.pngwing.com/pngs/527/625/png-transparent-scalable-graphics-computer-icons-upload-uploading-cdr-angle-text-thumbnail.png"
  );
  const [description, setDescription] = useState("");
  const [showExample, setShowExample] = useState(false);
  const [countries, setCountries] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [file, setFile] = useState<File>();

  const handleGetLanguages = async (country: string) => {
    // @ts-ignore
    const extractedLanguages = generative_context.artifacts.options.reduce(
      (acc: string[], item: any) => {
        if (item.primary === country) acc.push(...item.secondary);
        return acc;
      },
      [] as string[]
    );
    dispatch(resetAllButCountry());
    setLanguages(extractedLanguages);
    setFilterContext(null);
    updateModelInputs({
      origin_primary: country,
      origin_secondary: extractedLanguages[0],
    });
  };

  const handleCountryChange = (e: any) => {
    if (!e.value) return;
    dispatch(updateCountry(e.value));
    handleGetLanguages(e.value);
    dispatch(resetCategoryAndConcept());
  };

  const handleLanguageChange = (e: any) => {
    dispatch(updatelanguage(e.value));
    updateModelInputs({ origin_primary: country, origin_secondary: e.value });
  };

  const handleGetCategories = async () => {
    if (!country || !language) return;
    const data = await post("/context/get_contexts_from_s3", {
      artifacts: {
        task_id: taskId,
        language,
        country,
      },
    });
    if (response.ok) {
      setFilterContext(data);
    }
  };

  const handleSaveInput = async (e: any) => {
    updateModelInputs({ description: e.target.value });
    setDescription(e.target.value);
  };

  const handleSaveData = async () => {
    if (!selectedCategory) {
      alert("Please pick a category.");
      return;
    }
    if (!selectedConcept) {
      alert("Please pick a concept.");
      return;
    }
    if (!file) {
      alert("Please choose an image.");
      return;
    }
    if (description.length < 20) {
      alert("Please enter a description with at least 20 characters.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    axios
      .post(`${BASE_URL_2}/context/save_contexts_to_s3`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        params: {
          task_id: taskId,
          language,
          country,
          description,
          concept: selectedConcept.value,
          category: selectedCategory.value,
        },
      })
      .then((res) => {
        console.log(res);
      });
    setIsGenerativeContext(false);
  };

  useEffect(() => {
    console.log("generative_context", generative_context);
    if (generative_context.artifacts) {
      // @ts-ignore
      const extractedCountries = generative_context.artifacts.options.map(
        // @ts-ignore
        (item) => item.primary
      );
      setCountries(extractedCountries);
    }
  }, [generative_context]);

  useEffect(() => {
    if (country && !language) {
      handleGetLanguages(country);
    }
    if (country && language) {
      handleGetCategories();
    }
  }, [language, country]);

  useEffect(() => {
    selectedCategory && updateModelInputs({ category: selectedCategory.value });
  }, [selectedCategory]);

  useEffect(() => {
    selectedConcept && updateModelInputs({ concept: selectedConcept.value });
  }, [selectedConcept]);

  return (
    <>
      <div>
        <div className="flex items-center justify-center gap-8">
          <div className="pb-4 text-2xl font-bold">
            Select the country and language
          </div>
        </div>
        <div className="flex items-center justify-between gap-8 md:pb-12">
          {filterContext && (
            <div className="flex align-end">
              {showExample && (
                <>
                  <Modal
                    show={showExample}
                    onHide={() => {
                      setShowExample(false);
                    }}
                    size="lg"
                  >
                    <Modal.Header closeButton>
                      <Modal.Title>Example</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      <MDEditor.Markdown source={filterContext.example} />
                    </Modal.Body>
                  </Modal>
                </>
              )}
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 divide-x-2 md:grid-cols-3">
          <div className="col-span-1">
            <div className="flex flex-col items-center pt-2 pb-4 md:pb-16 align-center">
              <div className="flex gap-4 px-2 grid grid-cols-2 w-full">
                <div className="mr-4">
                  <p className="text-base">Country</p>
                  <Select
                    className="w-full"
                    options={countries.map((country) => ({
                      value: country,
                      label: country,
                    }))}
                    onChange={handleCountryChange}
                    placeholder="Select a country"
                    defaultValue={
                      country && {
                        value: country,
                        label: country,
                      }
                    }
                  />
                </div>
                <div>
                  <p className="text-base">Language</p>
                  <Select
                    value={
                      language && {
                        value: language,
                        label: language,
                      }
                    }
                    options={languages.map((language) => ({
                      value: language,
                      label: language,
                    }))}
                    onChange={handleLanguageChange}
                    placeholder="Select a language"
                    defaultValue={
                      language && {
                        value: language,
                        label: language,
                      }
                    }
                  />
                </div>
              </div>
            </div>
            {filterContext && (
              <>
                <div className="flex flex-col items-center py-2 space-y-3 align-center">
                  <DoubleDropDown
                    filterContext={filterContext}
                    updateModelInputs={updateModelInputs}
                  />
                </div>
                <div className="flex flex-row items-center justify-between py-8 mx-8 space-y-3 align-center">
                  <button
                    type="button"
                    className="mt-2 btn btn-outline-primary btn-sm btn-help-info"
                    onClick={() => {
                      setShowExample(!showExample);
                    }}
                  >
                    <span className="text-base font-normal text-letter-color">
                      Example
                    </span>
                  </button>
                  <GeneralButton
                    onClick={handleSaveData}
                    text="SAVE"
                    className="px-4 mt-[2px] font-semibold border-0 font-weight-bold light-gray-bg task-action-btn "
                  />
                </div>
              </>
            )}
          </div>
          {filterContext && (
            <div className="col-span-2 px-4">
              <div className="flex flex-col items-center w-full col-span-2 py-2 space-y-3 align-center">
                <ImageUpload
                  image={image}
                  setFile={setFile}
                  setImage={setImage}
                  updateModelInputs={updateModelInputs}
                  letMagnifier={file ? true : false}
                />
                <input
                  placeholder="Enter text here. Do not copy and paste"
                  onChange={handleSaveInput}
                  className="w-full h-12 p-4 bg-gray-100 border-gray-300 rounded-lg border-1"
                  minLength={20}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      {loading && (
        <div className="grid items-center justify-center grid-rows-2">
          <div className="mr-2 text-letter-color">Context is loading...</div>
          <PacmanLoader
            color="#ccebd4"
            loading={loading}
            size={50}
            className="align-center"
          />
        </div>
      )}
    </>
  );
};

export default DescribeImage;
