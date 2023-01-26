/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Container, Row, Card, CardGroup, Button, Form } from "react-bootstrap";
import Markdown from "react-markdown";
import { Formik } from "formik";
import UserContext from "./UserContext";

class PublishInterface extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      taskCode: props.match.params.taskCode,
      modelId: props.match.params.modelId,
      model: {},
    };
  }
  componentDidMount() {
    if (!this.context.api.loggedIn()) {
      this.props.history.push(
        "/login?&src=" + encodeURIComponent(`/models/${this.state.modelId}`)
      );
    }
    const propState = this.props.location.state;
    if (!propState) {
      this.props.history.push("/");
      return;
    }
    this.setState({
      model: propState.detail,
    });
  }
  handleValidation = (values) => {
    const errors = {};
    if (!values.name || values.name.trim() === "") {
      errors.name = "Required";
    }
    if (!values.description || values.description.trim() === "") {
      errors.description = "Required";
    }
    if (!values.params || values.params >>> 0 !== parseFloat(values.params)) {
      errors.params = "Required";
    }
    if (!values.languages || values.languages.trim() === "") {
      errors.languages = "Required";
    }
    if (!values.license || values.license.trim() === "") {
      errors.license = "Required";
    }
    return errors;
  };
  handleSubmit = (values, { setSubmitting }) => {
    const reqObj = {
      modelId: this.state.model.id,
      name: values.name,
      description: values.description,
      params: values.params,
      languages: values.languages,
      license: values.license,
      source_url: values.source_url,
      model_card: values.model_card,
      is_anonymous: values.is_anonymous,
    };
    this.context.api.updateModel(reqObj).then(
      (result) => {
        this.props.history.push({
          pathname: `/models/${this.state.model.id}`,
        });
      },
      (error) => {
        console.log(error);
        setSubmitting(false);
      }
    );
  };

  render() {
    const { model } = this.state;

    let modelCardTemplate = `## Model Details
(Enter your model details here)

## Data
* Training data: (Enter your training data here)
* Evaluation data: (Enter your dev data here)

## Additional Information
(Enter additional information here)

## Ethical and Fairness Considerations
(Enter ethical and fairness considerations here)`;

    return (
      <Container>
        <Row>
          <h2 className="text-uppercase principal-color">
            Update your model's information
          </h2>
        </Row>
        <Row>
          <CardGroup style={{ marginTop: 20, width: "100%" }}>
            <Card>
              <Card.Body>
                {Object.keys(model).length ? (
                  <Formik
                    initialValues={{
                      name: model.name || "",
                      description: model.longdesc || "",
                      params: model.params,
                      languages: model.languages || "",
                      license: model.license || "",
                      source_url: model.source_url || "",
                      model_card: model.model_card || modelCardTemplate,
                      is_anonymous: model.is_anonymous || false,
                    }}
                    validate={this.handleValidation}
                    onSubmit={this.handleSubmit}
                  >
                    {({
                      values,
                      errors,
                      handleChange,
                      handleSubmit,
                      isSubmitting,
                    }) => (
                      <>
                        <form onSubmit={handleSubmit} className="ml-2">
                          <Form.Group>
                            <Form.Label>
                              <b>Model Name</b>
                            </Form.Label>
                            <Form.Control
                              name="name"
                              type="text"
                              style={{
                                borderColor: errors.name ? "red" : null,
                              }}
                              placeholder="Provide a name for your model"
                              onChange={handleChange}
                              value={values.name}
                            />
                          </Form.Group>
                          <Form.Group>
                            <Form.Label>
                              <b>Summary</b>
                            </Form.Label>
                            <Form.Control
                              name="description"
                              type="text"
                              style={{
                                borderColor: errors.description ? "red" : null,
                              }}
                              placeholder="Provide a description of your model"
                              onChange={handleChange}
                              value={values.description}
                            />
                          </Form.Group>
                          <Form.Group>
                            <Form.Label>
                              <b>Number of Parameters</b>
                            </Form.Label>
                            <Form.Control
                              name="params"
                              type="int"
                              style={{
                                borderColor: errors.params ? "red" : null,
                              }}
                              onChange={handleChange}
                              value={values.params}
                              aria-describedby="paramsHelpBlock"
                            />
                            <Form.Text id="paramsHelpBlock" muted>
                              <Markdown>
                                To count the number of parameters, you can run
                                `sum(p.numel() for p in model.parameters() if
                                p.requires_grad)` in PyTorch.
                              </Markdown>
                            </Form.Text>
                          </Form.Group>
                          <Form.Group>
                            <Form.Label>
                              <b>Language(s)</b>
                            </Form.Label>
                            <Form.Control
                              name="languages"
                              type="text"
                              style={{
                                borderColor: errors.languages ? "red" : null,
                              }}
                              placeholder="e.g. English, Chinese"
                              onChange={handleChange}
                              value={values.languages}
                            />
                          </Form.Group>
                          <Form.Group>
                            <Form.Label>
                              <b>License(s)</b>
                            </Form.Label>
                            <Form.Control
                              name="license"
                              type="text"
                              style={{
                                borderColor: errors.license ? "red" : null,
                              }}
                              placeholder="e.g. Apache 2.0"
                              onChange={handleChange}
                              value={values.license}
                            />
                          </Form.Group>
                          <Form.Group>
                            <Form.Label>
                              <b>Paper Link</b>
                            </Form.Label>
                            <Form.Control
                              name="source_url"
                              type="url"
                              placeholder="e.g. https://arxiv.org/abs/1810.04805"
                              onChange={handleChange}
                              value={values.source_url}
                            />
                          </Form.Group>
                          <Form.Group>
                            <Form.Label>
                              <b>Model Card</b>
                            </Form.Label>
                            <Form.Control
                              as="textarea"
                              name="model_card"
                              defaultValue={values.model_card}
                              rows="12"
                              onChange={handleChange}
                            />
                            <Form.Text id="paramsHelpBlock" muted>
                              <Markdown>
                                The text will be rendered as
                                [markdown](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)
                                in model page. For more details on [model
                                cards](https://arxiv.org/abs/1810.03993).
                              </Markdown>
                            </Form.Text>
                          </Form.Group>
                          <Form.Group controlId="is_anonymous">
                            <b>
                              <Form.Check
                                label="Anonymous when Published?"
                                checked={values.is_anonymous}
                                onChange={handleChange}
                              />
                            </b>
                          </Form.Group>
                          <Button
                            type="submit"
                            variant="primary"
                            className="fadeIn third submitBtn button-ellipse"
                            disabled={isSubmitting}
                          >
                            Update
                          </Button>
                        </form>
                      </>
                    )}
                  </Formik>
                ) : null}
              </Card.Body>
            </Card>
          </CardGroup>
        </Row>
      </Container>
    );
  }
}

export default PublishInterface;
