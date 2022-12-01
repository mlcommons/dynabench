/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Col,
  Container,
  Row,
  Form,
  Modal,
} from "react-bootstrap";
import { useForm } from "react-hook-form";
import { createBatchSamples } from "../../services/ModelCentricServices";
import { CSVDownload } from "react-csv";
import Swal from "sweetalert2";

const BatchCreateSamples = (modelUrl) => {
  const [csvPrediction, setCsvPrediction] = useState();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (csvPrediction) {
      setCsvPrediction();
    }
  }, [csvPrediction]);

  const onSubmit = (modelData) => {
    setLoading(true);
    const file = modelData.file[0];
    const formData = new FormData();
    formData.append("file", file);
    createBatchSamples(formData, modelUrl.modelUrl).then((response) => {
      setCsvPrediction(response.data);
      setLoading(false);
      Swal.fire({
        title: "Success!",
        text: "Here are your predictions",
        icon: "success",
        showConfirmButton: false,
        timer: 2500,
      }).then(() => {
        window.location.reload();
      });
    });
  };

  const { register, handleSubmit } = useForm({
    mode: "onTouched",
    reValidateMode: "onSubmit",
  });

  const [fileName, setFileName] = useState();

  const handleChange = (e) => {
    setFileName(e.target.value);
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Modal.Header closeButton>
        <Modal.Title>Batch Samples</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3" controlId="modelName"></Form.Group>
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
                placeholder="Drag & drop your jsonl file here"
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
              <Form.Label className="label-upload-file">
                Drag & drop your jsonl file here
              </Form.Label>
              <Form.Control
                placeholder="Drag & drop your jsonl file here"
                autoFocus
                type="file"
                className="input-upload-file"
                {...register("file", { required: true })}
                onChange={handleChange}
              />
            </>
          )}
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        {csvPrediction && <CSVDownload data={csvPrediction} target="_blank" />}
        <Button variant="primary" type="submit">
          Upload samples
          <i className={loading ? "fa fa-cog fa-spin" : ""} />
        </Button>
      </Modal.Footer>
    </Form>
  );
};

export default BatchCreateSamples;
