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
import {
  Container,
  Row,
  Col,
  Card,
  DropdownButton,
  Dropdown,
  Modal,
  Form,
  Button,
  Spinner,
  InputGroup,
} from "react-bootstrap";
import UserContext from "../../containers/UserContext";
import {
  OverlayProvider,
  BadgeOverlay,
  Annotation,
} from "../../containers/Overlay";
import AnnotationComponent from "./AnnotationComponent.js";
import initializeData from "./InitializeAnnotationData.js";
const yaml = require("js-yaml");

function deepCopyJSON(obj) {
  return JSON.parse(JSON.stringify(obj));
}

class ValidateInterface extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      taskCode: null,
      task: {},
      example: {},
      ownerMode: false,
      ownerValidationFlagFilter: "Any",
      ownerValidationDisagreementFilter: "Any",
      validatorAction: null,
      taskConfig: null,
      data: {},
      loading: true,
      admin_or_owner: false,
    };
    this.getNewExample = this.getNewExample.bind(this);
    this.handleResponse = this.handleResponse.bind(this);
    this.setRangesAndGetRandomFilteredExample =
      this.setRangesAndGetRandomFilteredExample.bind(this);
    this.updateUserSettings = this.updateUserSettings.bind(this);
    this.updateOwnerValidationFlagFilter =
      this.updateOwnerValidationFlagFilter.bind(this);
    this.updateOwnerValidationDisagreementFilter =
      this.updateOwnerValidationDisagreementFilter.bind(this);
  }
  componentDidMount() {
    const {
      match: { params },
    } = this.props;
    if (!this.context.api.loggedIn()) {
      this.props.history.push(
        "/login?msg=" +
          encodeURIComponent(
            "Please log in or sign up so that you can get credit for your generated examples."
          ) +
          "&src=" +
          encodeURIComponent(`/tasks/${params.taskCode}/validate`)
      );
    }

    if (this.context.user.settings_json) {
      const settings = JSON.parse(this.context.user.settings_json);
      if (settings.hasOwnProperty("owner_validation_flag_filter")) {
        this.setState({
          ownerValidationFlagFilter: settings["owner_validation_flag_filter"],
        });
      }
      if (settings.hasOwnProperty("owner_validation_disagreement_filter")) {
        this.setState({
          ownerValidationDisagreementFilter:
            settings["owner_validation_disagreement_filter"],
        });
      }
    }

    this.setState({ taskCode: params.taskCode }, function () {
      this.context.api.getTask(this.state.taskCode).then(
        (result) => {
          this.setState(
            { task: result, taskCode: result.task_code },
            function () {
              this.context.api
                .getAdminOrOwner(this.state.task.id)
                .then((result) => {
                  this.setState({ admin_or_owner: result.admin_or_owner });
                });
              // eslint-disable-next-line react/no-direct-mutation-state
              this.state.task.selected_round = this.state.task.cur_round;
              this.getNewExample();
              if (params.taskCode !== this.state.taskCode) {
                this.props.history.replace({
                  pathname: this.props.location.pathname.replace(
                    `/tasks/${params.taskCode}`,
                    `/tasks/${this.state.taskCode}`
                  ),
                  search: this.props.location.search,
                });
              }
            }
          );
        },
        (error) => {
          console.log(error);
          if (error.status_code === 404 || error.status_code === 405) {
            this.props.history.push("/");
          }
        }
      );
    });
  }

  getNewExample() {
    this.setState(
      {
        validatorAction: null,
        loading: true,
      },
      () =>
        (this.state.ownerMode
          ? this.setRangesAndGetRandomFilteredExample()
          : this.context.api.getRandomExample(
              this.state.task.id,
              this.state.task.selected_round
            )
        ).then(
          (result) => {
            const taskConfig = yaml.load(this.state.task.config_yaml);
            taskConfig.input = taskConfig.input ? taskConfig.input : [];
            taskConfig.output = taskConfig.output ? taskConfig.output : [];
            taskConfig.context = taskConfig.context ? taskConfig.context : [];

            // output is stored in a condensed format, where the task owner can
            // specify the name of an annotation component without the type or
            // other arguments, as long as that component is also in input or
            // context. Here, we are getting the full annotation component info
            // and making sure it is in output.
            const expandedOutput = [];
            for (const obj of taskConfig.output) {
              const expandedObj = deepCopyJSON(taskConfig.input)
                .concat(deepCopyJSON(taskConfig.context))
                .filter((item) => item.name === obj.name);
              if (expandedObj.length > 0) {
                expandedOutput.push(JSON.parse(JSON.stringify(expandedObj[0])));
              } else {
                expandedOutput.push(obj);
              }
            }
            taskConfig.output = expandedOutput;
            taskConfig.metadata = taskConfig.metadata
              ? taskConfig.metadata
              : {};
            taskConfig.metadata.create = taskConfig.metadata.create
              ? taskConfig.metadata.create
              : [];
            taskConfig.metadata.validate = taskConfig.metadata.validate
              ? taskConfig.metadata.validate
              : [];

            const context = JSON.parse(result.context.context_json);
            const input = JSON.parse(result.input_json);
            const createMetadata = JSON.parse(result.metadata_json);
            const validateMetadata = initializeData(
              taskConfig.metadata.validate
            );
            this.setState({
              example: result,
              taskConfig: taskConfig,
              data: Object.assign(
                {},
                input,
                createMetadata,
                context,
                validateMetadata
              ),
              loading: false,
            });
          },
          (error) => {
            console.log(error);
            this.setState({
              loading: false,
              example: false,
            });
          }
        )
    );
  }

  handleResponse() {
    const mode = this.state.ownerMode ? "owner" : "user";
    const filteredValidatorMetadata = {};
    for (const taskConfigObj of this.state.taskConfig.metadata.validate) {
      if (this.state.data[taskConfigObj.name] !== null) {
        filteredValidatorMetadata[taskConfigObj.name] =
          this.state.data[taskConfigObj.name];
      }
    }

    this.context.api
      .validateExample(
        this.state.example.id,
        this.state.validatorAction,
        mode,
        filteredValidatorMetadata
      )
      .then(
        (result) => {
          this.getNewExample();
          if (!!result.badges) {
            this.setState({ showBadges: result.badges });
          }
        },
        (error) => {
          console.log(error);
        }
      );
  }

  setRangesAndGetRandomFilteredExample() {
    var minNumFlags;
    var maxNumFlags;
    var minNumDisagreements;
    var maxNumDisagreements;

    if (this.state.ownerValidationFlagFilter === "Any") {
      minNumFlags = 0;
      maxNumFlags = 5;
    } else {
      minNumFlags = this.state.ownerValidationFlagFilter;
      maxNumFlags = this.state.ownerValidationFlagFilter;
    }

    if (this.state.ownerValidationDisagreementFilter === "Any") {
      minNumDisagreements = 0;
      maxNumDisagreements = 4;
    } else {
      minNumDisagreements = this.state.ownerValidationDisagreementFilter;
      maxNumDisagreements = this.state.ownerValidationDisagreementFilter;
    }

    return this.context.api.getRandomFilteredExample(
      this.state.task.id,
      this.state.task.selected_round,
      minNumFlags,
      maxNumFlags,
      minNumDisagreements,
      maxNumDisagreements
    );
  }

  updateUserSettings(key, value) {
    var settings;
    if (this.context.user.settings_json) {
      settings = JSON.parse(this.context.user.settings_json);
    } else {
      settings = {};
    }
    settings[key] = value;
    this.context.user.settings_json = JSON.stringify(settings);
    this.context.api.updateUser(this.context.user.id, this.context.user);
  }

  updateOwnerValidationFlagFilter(value) {
    this.updateUserSettings("owner_validation_flag_filter", value);
    this.setState({ ownerValidationFlagFilter: value }, () => {
      this.getNewExample();
    });
  }

  updateOwnerValidationDisagreementFilter(value) {
    this.updateUserSettings("owner_validation_disagreement_filter", value);
    this.setState({ ownerValidationDisagreementFilter: value }, () => {
      this.getNewExample();
    });
  }

  render() {
    const inputMetadataInterface = this.state.taskConfig?.input
      .concat(
        this.state.taskConfig.metadata.create.filter(
          (taskConfigObj) =>
            taskConfigObj.model_wrong_condition === undefined ||
            taskConfigObj.model_wrong_condition ===
              this.state.example.model_wrong
        )
      )
      .filter(
        (taskConfigObj) =>
          ![undefined, null].includes(this.state.data[taskConfigObj.name])
      )
      .map((taskConfigObj) => (
        <div key={taskConfigObj.name} className="mb-3">
          <AnnotationComponent
            displayName={taskConfigObj.display_name}
            className="name-display-primary"
            key={taskConfigObj.name}
            name={taskConfigObj.name}
            data={this.state.data}
            type={taskConfigObj.type}
            configObj={taskConfigObj}
          />
        </div>
      ));

    const contextInterface = this.state.taskConfig?.old_context.map(
      (taskConfigObj) => (
        <AnnotationComponent
          displayName={taskConfigObj.display_name}
          className="name-display-primary"
          key={taskConfigObj.name}
          name={taskConfigObj.name}
          data={this.state.data}
          type={taskConfigObj.type}
          configObj={taskConfigObj}
        />
      )
    );

    const validatorMetadataInterface = this.state.taskConfig?.metadata.validate
      ?.filter(
        (taskConfigObj) =>
          taskConfigObj.validated_label_condition === undefined ||
          taskConfigObj.validated_label_condition === this.state.validatorAction
      )
      .map((taskConfigObj) => (
        <div key={taskConfigObj.name} className="mt-1 mb-1">
          <AnnotationComponent
            displayName={taskConfigObj.display_name}
            className="user-input-secondary"
            key={taskConfigObj.name}
            create={true}
            name={taskConfigObj.name}
            data={this.state.data}
            setData={(data) => this.setState({ data: data })}
            type={taskConfigObj.type}
            configObj={taskConfigObj}
          />
        </div>
      ));

    return (
      <OverlayProvider initiallyHide={true}>
        <BadgeOverlay
          badgeTypes={this.state.showBadges}
          show={!!this.state.showBadges}
          onHide={() => this.setState({ showBadges: "" })}
        ></BadgeOverlay>
        <Container className="pb-5 mb-5">
          <Col className="m-auto" lg={12}>
            {this.state.admin_or_owner && (
              <div style={{ float: "right" }}>
                <Annotation
                  placement="top"
                  tooltip="Click to adjust your owner validation filters"
                >
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm btn-help-info"
                    onClick={() => {
                      this.setState({ showOwnerValidationFiltersModal: true });
                    }}
                  >
                    <i className="fa fa-cog"></i>
                  </button>
                </Annotation>
                <Modal
                  show={this.state.showOwnerValidationFiltersModal}
                  onHide={() =>
                    this.setState({ showOwnerValidationFiltersModal: false })
                  }
                >
                  <Modal.Header closeButton>
                    <Modal.Title>Owner Validation Filters</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <Form.Check
                      checked={this.state.ownerMode}
                      label="Enter task owner mode?"
                      onChange={() => {
                        this.setState(
                          { ownerMode: !this.state.ownerMode },
                          this.componentDidMount()
                        );
                      }}
                    />
                    {this.state.ownerMode && (
                      <div>
                        <DropdownButton
                          variant="light"
                          className="p-1"
                          title={
                            this.state.ownerValidationFlagFilter.toString() +
                            " flag" +
                            (this.state.ownerValidationFlagFilter !== 1
                              ? "s"
                              : "")
                          }
                        >
                          {["Any", 0, 1, 2, 3, 4, 5].map((target, index) => (
                            <Dropdown.Item
                              onClick={() =>
                                this.updateOwnerValidationFlagFilter(target)
                              }
                              key={index}
                              index={index}
                            >
                              {target}
                            </Dropdown.Item>
                          ))}
                        </DropdownButton>
                        <DropdownButton
                          variant="light"
                          className="p-1"
                          title={
                            this.state.ownerValidationDisagreementFilter.toString() +
                            " correct/incorrect disagreement" +
                            (this.state.ownerValidationDisagreementFilter !== 1
                              ? "s"
                              : "")
                          }
                        >
                          {["Any", 0, 1, 2, 3, 4].map((target, index) => (
                            <Dropdown.Item
                              onClick={() =>
                                this.updateOwnerValidationDisagreementFilter(
                                  target
                                )
                              }
                              key={index}
                              index={index}
                            >
                              {target}
                            </Dropdown.Item>
                          ))}
                        </DropdownButton>
                      </div>
                    )}
                  </Modal.Body>
                </Modal>
              </div>
            )}
            <div className="pt-3 mt-4">
              <p className="mb-0 text-uppercase spaced-header">
                {this.state.task.name}
              </p>
              <h2 className="mt-0 ml-0 text-2xl task-page-header d-block text-reset">
                Validate examples
              </h2>
            </div>
            {this.state.taskConfig?.content_warning && (
              <p className="p-3 mt-3 rounded light-red-bg white-color">
                <strong>WARNING</strong>:{" "}
                {this.state.taskConfig.content_warning}
              </p>
            )}
            <Card className="profile-card">
              {!this.state.loading ? (
                this.state.example ? (
                  <>
                    {contextInterface && contextInterface.length > 0 && (
                      <div className="p-3 mb-1 rounded light-gray-bg">
                        {contextInterface}
                      </div>
                    )}
                    <Card.Body className="p-3">
                      <Row>
                        <Col xs={12} md={7}>
                          {inputMetadataInterface}
                          <h6 className="text-uppercase dark-principal-color spaced-header">
                            Actions:
                          </h6>
                          <InputGroup className="align-items-center">
                            <Form.Check
                              checked={this.state.validatorAction === "correct"}
                              type="radio"
                              onChange={() =>
                                this.setState({ validatorAction: "correct" })
                              }
                            />
                            <i className="fas fa-thumbs-up"></i> &nbsp;{" "}
                            {this.state.ownerMode && "Verified "} Correct
                          </InputGroup>
                          <InputGroup className="align-items-center">
                            <Form.Check
                              checked={
                                this.state.validatorAction === "incorrect"
                              }
                              type="radio"
                              onChange={() =>
                                this.setState({ validatorAction: "incorrect" })
                              }
                            />
                            <i className="fas fa-thumbs-down"></i> &nbsp;{" "}
                            {this.state.ownerMode && "Verified "} Incorrect
                          </InputGroup>
                          {!this.state.ownerMode && (
                            <InputGroup className="align-items-center">
                              <Form.Check
                                checked={
                                  this.state.validatorAction === "flagged"
                                }
                                type="radio"
                                onChange={() =>
                                  this.setState({ validatorAction: "flagged" })
                                }
                              />
                              <i className="fas fa-flag"></i> &nbsp; Flag
                            </InputGroup>
                          )}
                          <br />
                          {this.state.validatorAction !== null &&
                            validatorMetadataInterface.length > 0 && (
                              <>
                                <div>
                                  <h6 className="text-uppercase dark-principal-color spaced-header">
                                    You can enter more information:
                                  </h6>
                                  {validatorMetadataInterface}
                                </div>
                                <br />
                              </>
                            )}
                        </Col>
                      </Row>
                      <InputGroup className="align-items-center">
                        <Button
                          type="button"
                          className="border-0 font-weight-bold principal-color-bg task-action-btn"
                          onClick={() => this.handleResponse()}
                        >
                          {" "}
                          Submit{" "}
                        </Button>
                        <Button
                          data-index={this.props.index}
                          onClick={this.getNewExample}
                          type="button"
                          className="ml-2 border-0 font-weight-bold principal-color light-gray-bg task-action-btn"
                        >
                          <i className="fas fa-undo-alt"></i> Skip and load new
                          example
                        </Button>
                      </InputGroup>
                    </Card.Body>
                  </>
                ) : (
                  <Card.Body className="p-3">
                    <Row>
                      <Col xs={12} md={7}>
                        <p>
                          No more examples to be verified. Please create more
                          examples!
                        </p>
                      </Col>
                    </Row>
                  </Card.Body>
                )
              ) : (
                <div className="mx-auto my-3">
                  <Spinner animation="border" />{" "}
                </div>
              )}
              <div className="p-2">
                {this.state.ownerMode && (
                  <p style={{ color: "red" }}>
                    WARNING: You are in "Task owner mode." You can verify
                    examples as correct or incorrect without input from anyone
                    else!!
                  </p>
                )}
              </div>
            </Card>
          </Col>
        </Container>
      </OverlayProvider>
    );
  }
}

export default ValidateInterface;
