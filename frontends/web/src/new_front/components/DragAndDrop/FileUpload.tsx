import React, { ChangeEvent } from "react";
import { useDropzone } from "react-dropzone";

interface FileUploadProps {
  fileName?: string | undefined;
  setFileName: React.Dispatch<React.SetStateAction<string | undefined>>;
  handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  register: any; // Adjust the type of register according to your useForm usage
}

const FileUpload: React.FC<FileUploadProps> = ({
  fileName,
  setFileName,
  handleChange,
  register,
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".zip"],
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFileName(acceptedFiles[0].name);
        register("file", { value: acceptedFiles[0] });
      }
    },
    maxFiles: 1,
  });

  return (
    <div className="max-w-md mx-auto">
      {fileName ? (
        <div className="mb-4">
          <div className="p-4 bg-white border rounded-md shadow-md">
            <div className="flex items-center justify-between gap-3">
              <div className="">{fileName}</div>
              <button
                className="pt-1 text-red-500 hover:text-red-700"
                onClick={() => setFileName(undefined)}
              >
                Delete
              </button>
            </div>
          </div>
          <div className="mt-4">
            <input
              {...getInputProps()}
              onChange={handleChange}
              className="hidden"
            />
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`bg-white border border-dashed rounded-md p-8 text-center ${
            isDragActive ? "border-blue-500" : ""
          }`}
        >
          <input {...getInputProps()} onChange={handleChange} />
          <p className="text-gray-600">
            Drag & drop your zip model here, or click to select a zip model
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
