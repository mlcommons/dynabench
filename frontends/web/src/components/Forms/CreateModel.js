/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { useForm } from "react-hook-form";

const CreateModel = ({ handleClose, ...props }) => {
  const initState = {
    modelName: "",
    desc: "",
    numParams: "",
    languages: "",
    license: "",
    modelCard: "",
  };

  // eslint-disable-next-line no-unused-vars
  const [initialValues, setInitialValues] = useState(initState);

  const onSubmit = (values) => {
    console.log("Values:::", values);
  };

  const {
    register,
    handleSubmit,
    getValues,
    watch,
    formState: { errors },
  } = useForm({
    mode: "onTouched",
    reValidateMode: "onSubmit",
    // reValidateMode: "onChange",
    defaultValues: initialValues,
  });

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      console.log(">>", value, name, type);
      // {1: '1', 2: '9'} '2' 'change'
    });

    return () => subscription.unsubscribe();
  }, [watch]);

  return (
    <>
      <Modal.Header closeButton>
        <Modal.Title>Submit Model</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-3" controlId="modelName">
            <Form.Label>Model name</Form.Label>
            <Form.Control
              placeholder="Model name"
              autoFocus
              {...register("modelName")}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="desc">
            <Form.Label>Description</Form.Label>
            <Form.Control
              placeholder="Description"
              autoFocus
              {...register("desc")}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="numParams">
            <Form.Label>Num parameters</Form.Label>
            <Form.Control
              placeholder="Num parameters"
              autoFocus
              {...register("numParams")}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="languages">
            <Form.Label>Languages</Form.Label>
            <Form.Control
              placeholder="Languages"
              autoFocus
              {...register("languages")}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="license">
            <Form.Label>License</Form.Label>
            <Form.Control
              placeholder="License"
              autoFocus
              {...register("license")}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="modelCard">
            <Form.Label>Model Card</Form.Label>
            <Form.Control
              placeholder="Model Card"
              autoFocus
              {...register("modelCard")}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
        <Button variant="primary" onClick={onSubmit}>
          Save Changes
        </Button>
      </Modal.Footer>
    </>
  );
};

export default CreateModel;
