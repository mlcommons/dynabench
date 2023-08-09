import React, { FC } from "react";
import { Button } from "react-bootstrap";
import Form from "react-bootstrap/Form";
import { useForm } from "react-hook-form";
import Modal from "react-bootstrap/Modal";
import useFetch from "use-http";
import Swal from "sweetalert2";

type UpdateModelInfoProps = {
  modelId: number;
  name: string;
  desc: string;
  longdesc: string;
  params: number;
  languages: string;
  license: string;
  source_url: string;
  handleClose: () => void;
};

const UpdateModelInfo: FC<UpdateModelInfoProps> = ({
  modelId,
  handleClose,
  name,
  desc,
  longdesc,
  params,
  languages,
  license,
  source_url,
}) => {
  console.log("source_url", source_url);

  const { post, response } = useFetch();
  const initialValues = {
    name,
    desc,
    longdesc,
    params,
    languages,
    license,
    source_url,
  };
  const { register, handleSubmit } = useForm({
    mode: "onTouched",
    reValidateMode: "onSubmit",
    defaultValues: initialValues,
  });

  const onSubmit = async (data: any) => {
    await post("model/update_model_info", {
      model_id: modelId,
      name: data.name,
      desc: data.desc,
      longdesc: data.longdesc,
      params: parseInt(data.params),
      languages: data.languages,
      license: data.license,
      source_url: data.source_url,
    });
    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Your model info has been updated!",
        confirmButtonText: "Ok",
      });
      handleClose();
      window.location.reload();
    } else {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong!",
      });
    }
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Modal.Body>
        <Form.Group className="mb-3" controlId="name">
          <Form.Label className="text-lg font-bold text-letter-color">
            Model name
          </Form.Label>
          <Form.Control autoFocus {...register("name")} />
        </Form.Group>
        <Form.Group className="mb-3" controlId="desc">
          <Form.Label className="text-lg font-bold text-letter-color">
            Short description
          </Form.Label>
          <Form.Control placeholder={desc} autoFocus {...register("desc")} />
        </Form.Group>
        <Form.Group className="mb-3" controlId="longdesc">
          <Form.Label className="text-lg font-bold text-letter-color">
            Description
          </Form.Label>
          <Form.Control autoFocus as="textarea" {...register("longdesc")} />
        </Form.Group>
        <Form.Group className="mb-3" controlId="params">
          <Form.Label className="text-lg font-bold text-letter-color">
            Params
          </Form.Label>
          <Form.Control autoFocus {...register("params")} />
        </Form.Group>
        <Form.Group className="mb-3" controlId="languages">
          <Form.Label className="text-lg font-bold text-letter-color">
            Languages
          </Form.Label>
          <Form.Control autoFocus {...register("languages")} />
        </Form.Group>
        <Form.Group className="mb-3" controlId="license">
          <Form.Label className="text-lg font-bold text-letter-color">
            License
          </Form.Label>
          <Form.Control autoFocus {...register("license")} />
        </Form.Group>
        <Form.Group className="mb-3" controlId="source_url">
          <Form.Label className="text-lg font-bold text-letter-color">
            Source URL
          </Form.Label>
          <Form.Control autoFocus {...register("source_url")} />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
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
          Update
        </Button>
      </Modal.Footer>
    </Form>
  );
};

export default UpdateModelInfo;
