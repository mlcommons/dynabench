import UserContext from "containers/UserContext";
import React, { useContext, useState, useEffect } from "react";
import { Button, Card, Col, Container, Form, Row } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useHistory, useParams } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { PacmanLoader } from "react-spinners";
import { checkUserIsLoggedIn } from "new_front/utils/helpers/functions/LoginFunctions";

const SubmitPrediction = () => {
  const [file, setFile] = useState<any>();
  const [loading, setLoading] = useState(false);
  const { user } = useContext(UserContext);
  const history = useHistory();
  let { taskCode } = useParams<{ taskCode: string }>();
  const initState = {
    modelName: "",
    file: "",
  };
  const { register, handleSubmit } = useForm({
    mode: "onTouched",
    reValidateMode: "onSubmit",
    defaultValues: initState,
  });

  const handleData = async () => {
    const isLogin = await checkUserIsLoggedIn(
      history,
      `/tasks/${taskCode}/submit_prediction`
    );
  };

  useEffect(() => {
    handleData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmitModel = async (modelData: any) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("predictions", modelData.file[0]);
    const BASE_URL_2 = process.env.REACT_APP_API_HOST_2;
    await axios
      .post(`${BASE_URL_2}/model/upload_prediction_to_s3`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        params: {
          user_id: user.id,
          task_code: taskCode,
          model_name: modelData.modelName.replace(/\s/g, "_"),
        },
      })
      .then((response) => {
        if (response.status === 200) {
          Swal.fire({
            title: "Success!",
            text: "Dataset uploaded successfully.",
            icon: "success",
            confirmButtonText: "Ok",
          }).then(() => {
            window.location.reload();
          });
        } else {
          Swal.fire({
            title: "Error!",
            text: "Something went wrong.",
            icon: "error",
            confirmButtonText: "Ok",
          });
        }
        setLoading(false);
      });
  };

  const onSubmit = (data: any) => {
    handleSubmitModel(data);
  };

  return (
    <>
      {!loading ? (
        <div className="container max-w-5xl ">
          <h1 className="pt-10 text-center">Submit Prediction</h1>
          <Container className="mt-5 ">
            <Row>
              <Col>
                <Card>
                  <Card.Body>
                    <Form
                      onSubmit={handleSubmit(onSubmit)}
                      className="m-8 d-flex flex-column"
                    >
                      <Form.Group controlId="formBasicEmail">
                        <Form.Label className="text-lg font-weight-bold">
                          Model Name
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter model name"
                          {...register("modelName", { required: true })}
                        />
                      </Form.Group>
                      <Form.Label className="text-lg font-weight-bold">
                        Upload Predictions
                      </Form.Label>
                      <Form.Group
                        controlId="predictions"
                        className="div-upload-file"
                      >
                        {file ? (
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
                                      <Col md={12}>
                                        {file.split("\\").pop()}
                                      </Col>
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
                                            setFile("");
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
                              {...register("file", { required: true })}
                              onChange={(e: any) => setFile(e.target.value)}
                            />
                          </>
                        ) : (
                          <>
                            <Form.Label className="text-base label-upload-file">
                              Drag & drop your .json file with predictions here
                            </Form.Label>
                            <Form.Control
                              placeholder="Drag & drop your .json file with predictions here"
                              autoFocus
                              type="file"
                              className="input-upload-file"
                              {...register("file", { required: true })}
                              onChange={(e: any) => setFile(e.target.value)}
                            />
                          </>
                        )}
                      </Form.Group>
                      <div className="d-flex justify-content-center">
                        <Button
                          variant="primary"
                          type="submit"
                          className="border-0 font-weight-bold light-gray-bg"
                        >
                          Submit Predictions
                        </Button>
                      </div>
                    </Form>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>
      ) : (
        <div className="grid items-center justify-center grid-rows-2">
          <div className="mr-2 text-letter-color">
            Data is being prepared, please wait...
          </div>
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

export default SubmitPrediction;
