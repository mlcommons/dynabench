import FileUpload from "new_front/components/DragAndDrop/FileUpload";
import React, { useState } from "react";
import { Form as BootstrapForm, Button } from "react-bootstrap";
import { useForm } from "react-hook-form";
import Select from "react-select";
import { LanguagePair } from "new_front/types/uploadModel/uploadModel";

interface CreateModelProps {
  isDynalab: boolean;
  languagePairs?: LanguagePair[];
  handleClose: () => void;
  handleSubmitModel: (values: any) => void;
}

const CreateModel = ({
  isDynalab,
  languagePairs = [],
  handleClose,
  handleSubmitModel,
}: CreateModelProps) => {
  const [selectedLanguages, setSelectedLanguages] = useState<any>([]);
  const initState = {
    modelName: " ",
    desc: " ",
    numParams: 0,
    languages: " ",
    license: " ",
    modelCard: " ",
    repoUrl: " ",
  };

  const options = languagePairs.map((pair, index) => {
    return {
      value: `option${index + 1}`,
      label: pair.alias,
      dataset_name: pair.dataset_name,
    };
  });

  const onSubmit = (values: any) => {
    if (languagePairs && languagePairs.length > 0) {
      // Extract dataset_name based on the selected alias
      const selectedDatasets = selectedLanguages.map((lang: any) => {
        const pair = languagePairs.find(
          (pair: any) => pair.alias === lang.label,
        );
        return pair ? pair.dataset_name : "";
      });
      values.languages = selectedDatasets.join(", "); // Save dataset_names
    }

    console.log("values", values);

    // handleSubmitModel(values);
    // handleClose();
  };

  const { register, handleSubmit } = useForm({
    mode: "onTouched",
    reValidateMode: "onSubmit",
    defaultValues: initState,
  });

  const [fileName, setFileName] = useState<string | undefined>();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFileName(e.target.files[0].name);
    }
  };

  return (
    <BootstrapForm onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col items-center justify-center ">
        <BootstrapForm.Group className="mb-3" controlId="modelName">
          <BootstrapForm.Label className="text-base">
            Model name*
          </BootstrapForm.Label>
          <BootstrapForm.Control
            placeholder="Model name"
            autoFocus
            {...register("modelName")}
          />
        </BootstrapForm.Group>
        <BootstrapForm.Group className="mb-3" controlId="desc">
          <BootstrapForm.Label className="text-base">
            Description (optional)
          </BootstrapForm.Label>
          <BootstrapForm.Control
            placeholder="Description"
            autoFocus
            {...register("desc")}
          />
        </BootstrapForm.Group>
        <BootstrapForm.Group className="mb-3" controlId="numParams">
          <BootstrapForm.Label className="text-base">
            Num parameters (optional)
          </BootstrapForm.Label>
          <BootstrapForm.Control
            placeholder="Num parameters"
            autoFocus
            {...register("numParams")}
          />
        </BootstrapForm.Group>
        {languagePairs && languagePairs.length > 0 && (
          <>
            <BootstrapForm.Group
              className="flex flex-col items-center justify-center mb-3"
              controlId="languages"
            >
              <BootstrapForm.Label className="text-base">
                Languages
              </BootstrapForm.Label>
              <div className="min-w-full text-letter-color">
                <Select
                  isMulti
                  options={options}
                  {...register("languages")}
                  closeMenuOnSelect={false}
                  onChange={(selectedOption: any) => {
                    setSelectedLanguages(selectedOption);
                  }}
                />
              </div>
            </BootstrapForm.Group>
          </>
        )}
        <BootstrapForm.Group className="mb-3" controlId="license">
          <BootstrapForm.Label className="text-base">
            License (optional)
          </BootstrapForm.Label>
          <BootstrapForm.Control
            placeholder="License"
            autoFocus
            {...register("license")}
          />
        </BootstrapForm.Group>
        {isDynalab ? (
          <>
            <h3 className="text-base">Model Zip</h3>
            <FileUpload
              fileName={fileName}
              setFileName={setFileName}
              handleChange={handleChange}
              register={register}
            />
          </>
        ) : (
          <BootstrapForm.Group className="mb-3" controlId="repoUrl">
            <BootstrapForm.Label className="text-base">
              HF repo
            </BootstrapForm.Label>
            <BootstrapForm.Control
              placeholder="HF repo"
              autoFocus
              {...register("repoUrl")}
            />
          </BootstrapForm.Group>
        )}
      </div>
      <div className="flex justify-center gap-6 pt-4 pb-4">
        <Button
          variant="primary"
          onClick={handleClose}
          className="border-0 font-weight-bold light-gray-bg"
        >
          Close
        </Button>
        <Button
          variant="primary"
          type="submit"
          className="border-0 font-weight-bold light-gray-bg"
        >
          Submit Model
        </Button>
      </div>
    </BootstrapForm>
  );
};

export default CreateModel;
