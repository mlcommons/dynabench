import React, { useState } from "react";
import {
  Form as BootstrapForm,
  Button,
  Card,
  Col,
  Container,
  Row,
} from "react-bootstrap";
import { useForm } from "react-hook-form";
import FileUpload from "new_front/components/DragAndDrop/FileUpload";

interface CreateModelProps {
  isDynalab: boolean;
  handleClose: () => void;
  handleSubmitModel: (values: any) => void;
}

const CreateModel = ({
  isDynalab,
  handleClose,
  handleSubmitModel,
}: CreateModelProps) => {
  const initState = {
    modelName: " ",
    desc: " ",
    numParams: 0,
    languages: " ",
    license: " ",
    modelCard: " ",
    repoUrl: " ",
  };

  const onSubmit = (values: any) => {
    console.log("values", values);

    handleSubmitModel(values);
    handleClose();
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
        <BootstrapForm.Group className="mb-3" controlId="languages">
          <BootstrapForm.Label className="text-base">
            Languages (optional)
          </BootstrapForm.Label>
          <BootstrapForm.Control
            placeholder="Languages"
            autoFocus
            {...register("languages")}
          />
        </BootstrapForm.Group>
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
