/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState } from "react";
import { Button, Card, Col, Container, Row } from "react-bootstrap";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import { useForm } from "react-hook-form";
import "./CreateModel.css";

const CreateModel = ({ handleClose, handleSubmitModel, ...props }) => {
  const initState = {
    modelName: " ",
    desc: " ",
    numParams: 0,
    languages: " ",
    license: " ",
    modelCard: " ",
  };

  const onSubmit = (values) => {
    handleSubmitModel(values);
    handleClose();
  };

  const { register, handleSubmit } = useForm({
    mode: "onTouched",
    reValidateMode: "onSubmit",
    defaultValues: initState,
  });

  const [fileName, setFileName] = useState();

  const handleChange = (e) => {
    setFileName(e.target.value);
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Modal.Header closeButton>
        <Modal.Title>Submit Model</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3" controlId="modelName">
          <Form.Label className="text-base">Model name</Form.Label>
          <Form.Control
            placeholder="Model name"
            autoFocus
            {...register("modelName")}
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="desc">
          <Form.Label className="text-base">Description</Form.Label>
          <Form.Control
            placeholder="Description"
            autoFocus
            {...register("desc")}
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="numParams">
          <Form.Label className="text-base">Num parameters</Form.Label>
          <Form.Control
            placeholder="Num parameters"
            autoFocus
            {...register("numParams")}
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="languages">
          <Form.Label className="text-base">Languages</Form.Label>
          <Form.Control
            placeholder="Languages"
            autoFocus
            {...register("languages")}
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="license">
          <Form.Label className="text-base">License</Form.Label>
          <Form.Control
            placeholder="License"
            autoFocus
            {...register("license")}
          />
        </Form.Group>
        <Form.Group className="div-upload-file" controlId="file">
          {fileName ? (
            <>
              <div>
                <Card
                  style={{
                    borderRadius: 0,
                  }}
                >
                  <Card.Body>
                    <Container>
                      <Row>
                        <Col md={12}>{fileName}</Col>
                        <Col
                          md={12}
                          style={{
                            paddingTop: "20px",
                          }}
                        >
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => {
                              setFileName("");
                            }}
                          >
                            Delete
                          </Button>
                        </Col>
                      </Row>
                    </Container>
                  </Card.Body>
                </Card>
              </div>
              <Form.Control
                placeholder="Drag & drop your zip model here"
                autoFocus
                type="file"
                style={{
                  height: 0,
                }}
                {...register("file")}
                onChange={handleChange}
              />
            </>
          ) : (
            <>
              <Form.Label className="text-base label-upload-file">
                Drag & drop your zip model here
              </Form.Label>
              <Form.Control
                placeholder="Drag & drop your zip model here"
                autoFocus
                type="file"
                className="input-upload-file"
                {...register("file")}
                onChange={handleChange}
              />
            </>
          )}
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
          Submit Model
        </Button>
      </Modal.Footer>
    </Form>
  );
};

export default CreateModel;
