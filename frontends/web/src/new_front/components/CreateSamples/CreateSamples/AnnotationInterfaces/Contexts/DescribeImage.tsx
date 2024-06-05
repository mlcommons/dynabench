import GeneralButton from "new_front/components/Buttons/GeneralButton";
import BasicInput from "new_front/components/Inputs/BasicInput";
import { ContextConfigType } from "new_front/types/createSamples/createSamples/annotationContext";
import { ContextAnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import React, { FC, useContext, useEffect, useState } from "react";
import DoubleDropDown from "new_front/components/Inputs/DoubleDropDown";
import Select from "react-select";
import useFetch from "use-http";
import { PacmanLoader } from "react-spinners";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import axios from "axios";
import { Modal } from "react-bootstrap";
import MDEditor from "@uiw/react-md-editor";

type ImageUploadProps = {
  image: string;
  setFile: (file: File) => void;
  setImage: (image: string) => void;
  updateModelInputs: (input: object, metadata?: boolean) => void;
};

const ImageUpload = ({
  image,
  setFile,
  setImage,
  updateModelInputs,
}: ImageUploadProps) => {
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
      updateModelInputs({ image: file.name });
      setFile(file);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-center object-cover gap-8 pb-2">
        <img
          src={image}
          alt="src"
          className="rounded-lg"
          onDrag={handleDragEnter}
          onDragEnd={handleDragLeave}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragEnter}
          onDrop={handleDrop}
          onClick={() => {
            const input = document.getElementById("fileInput");
            if (input) {
              input.click();
            }
          }}
        />
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
  const [filterContext, setFilterContext] = useState<any>();
  const [image, setImage] = useState(
    "https://w7.pngwing.com/pngs/527/625/png-transparent-scalable-graphics-computer-icons-upload-uploading-cdr-angle-text-thumbnail.png",
  );
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    localStorage.getItem("selectedCategory")
      ? JSON.parse(localStorage.getItem("selectedCategory") || "")
      : null,
  );
  const [selectedConcept, setSelectedConcept] = useState(
    localStorage.getItem("selectedConcept")
      ? JSON.parse(localStorage.getItem("selectedConcept") || "")
      : null,
  );
  const [showExample, setShowExample] = useState(false);
  const { post, response, loading } = useFetch();
  const [countries, setCountries] = useState<string[]>([]);
  const [country, setCountry] = useState<string>(
    localStorage.getItem("country") || "",
  );
  const [languages, setLanguages] = useState<string[]>([]);
  const [language, setLanguage] = useState<string>(
    localStorage.getItem("language") || "",
  );
  const [file, setFile] = useState<File>();
  const BASE_URL_2 = process.env.REACT_APP_API_HOST_2;
  const { modelInputs, updateModelInputs, removeItem } = useContext(CreateInterfaceContext);

  const handleGetLanguages = async (e: any) => {
    if (!e.value) return;
    setCountry(e.value);
    // @ts-ignore
    const extractedLanguages = generative_context.artifacts.options.reduce(
      (acc: string[], item: any) => {
        if (item.primary === e.value) acc.push(...item.secondary);
        return acc;
      },
      [] as string[],
    );
    setLanguage("");
    setLanguages(extractedLanguages);
    setFilterContext(null);
    updateModelInputs({
      origin_primary: e.value,
      origin_secondary: extractedLanguages[0],
    });
  };

  const handleLanguageChange = (e: any) => {
    setLanguage(e.value);
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
    if (description.length < 20) {
      alert("Please enter a description with at least 20 characters.");
      return;
    }
    if (!file || !description || !selectedCategory || !selectedConcept) {
      alert(
        "Please choose an image, describe it, and pick a category and concept.",
      );
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
        (item) => item.primary,
      );
      setCountries(extractedCountries);
    }
  }, [generative_context]);

  useEffect(() => {
    if (country && language) {
      handleGetCategories();
    }
  }, [country, language]);

  useEffect(() => {
    localStorage.setItem("language", language);
    localStorage.setItem("country", country);
    localStorage.removeItem("selectedCategory");
    localStorage.removeItem("selectedConcept");
    removeItem("category");
    removeItem("concept");
    setSelectedCategory(null);
    setSelectedConcept(null);
  }, [language, country]);

  useEffect(() => {
    if (localStorage.getItem("language") && localStorage.getItem("country")) {
      updateModelInputs({
        origin_primary: localStorage.getItem("country"),
        origin_secondary: localStorage.getItem("language"),
      });
    }
    if (localStorage.getItem("selectedCategory")) {
      updateModelInputs({ category: selectedCategory.value });
    }
    if (localStorage.getItem("selectedConcept")) {
      updateModelInputs({ concept: selectedConcept.value });
    }
  }, [localStorage]);

  useEffect(() => {
    // If language and country are already selected then fetch the context
    if (localStorage.getItem("language") && localStorage.getItem("country")) {
      handleGetCategories();
    }
  }, [localStorage.getItem("language")]);

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
            <div className="flex flex-col items-center pt-2 pb-4 space-y-5 md:pb-16 align-center">
              <div className="flex gap-8">
                <div className="mr-4">
                  <p className="text-base">Country</p>
                  <Select
                    options={countries.map((country) => ({
                      value: country,
                      label: country,
                    }))}
                    onChange={handleGetLanguages}
                    placeholder="Select a country"
                    defaultValue={
                      localStorage.getItem("country") && {
                        value: localStorage.getItem("country"),
                        label: localStorage.getItem("country"),
                      }
                    }
                  />
                </div>
                <div>
                  <p className="text-base">Language</p>
                  <Select
                    options={languages.map((language) => ({
                      value: language,
                      label: language,
                    }))}
                    onChange={handleLanguageChange}
                    placeholder="Select a language"
                    defaultValue={
                      localStorage.getItem("language") && {
                        value: localStorage.getItem("language"),
                        label: localStorage.getItem("language"),
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
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    selectedConcept={selectedConcept}
                    setSelectedConcept={setSelectedConcept}
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
                    text="Submit"
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
