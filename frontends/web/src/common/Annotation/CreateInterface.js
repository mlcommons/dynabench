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

import BootstrapSwitchButton from "bootstrap-switch-button-react";
import React from "react";
import {
  Button,
  ButtonGroup,
  Card,
  Col,
  Container,
  Form,
  InputGroup,
  Modal,
  OverlayTrigger,
  Row,
  Spinner,
  Tooltip,
} from "react-bootstrap";
import Markdown from "react-markdown";
import {
  Annotation,
  BadgeOverlay,
  OverlayContext,
  OverlayProvider,
} from "../../containers/Overlay";
import UserContext from "../../containers/UserContext";
import AnnotationComponent from "./AnnotationComponent.js";
import AnnotationTitle from "../../new_front/components/CreateSamples/CreateSamples/AnnotationTitle";
import initializeData from "./InitializeAnnotationData.js";
import ResponseInfo from "./ResponseInfo.js";
import BatchCreateSamples from "../../components/Forms/BatchCreateSamples";
import { getModelInTheLoop } from "../../services/ModelServices";
const yaml = require("js-yaml");

function deepCopyJSON(obj) {
  return JSON.parse(JSON.stringify(obj));
}

class CreateInterface extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      taskId: null,
      taskCode: null,
      task: {},
      context: null,
      content: [],
      retainInput: false,
      livemode: true,
      submitDisabled: true,
      refreshDisabled: true,
      mapKeyToExampleId: {},
      submitWithoutFullExample: false,
      taskConfig: null,
      data: {},
      loading: true,
      modelInTheLoop: null,
    };
    this.getNewContext = this.getNewContext.bind(this);
    this.handleResponse = this.handleResponse.bind(this);
    this.switchLiveMode = this.switchLiveMode.bind(this);
    this.updateRetainInput = this.updateRetainInput.bind(this);
    this.initializeDataWrapper = this.initializeDataWrapper.bind(this);
    this.getInputData = this.getInputData.bind(this);
    this.storeExampleWrapper = this.storeExampleWrapper.bind(this);
    this.chatContainerRef = React.createRef();
    this.bottomAnchorRef = React.createRef();
    this.inputRef = React.createRef();
  }

  getInputData() {
    const inputData = {};
    for (const taskConfigObj of this.state.taskConfig.input) {
      inputData[taskConfigObj.name] = this.state.data[taskConfigObj.name];
    }
    return inputData;
  }

  initializeDataWrapper() {
    this.setState({
      data: Object.assign(
        {},
        initializeData(this.state.taskConfig.input),
        JSON.parse(this.state.context.context_json)
      ),
    });
  }

  getNewContext() {
    this.setState(
      { loading: true, submitDisabled: true, refreshDisabled: true },
      () => {
        this.context.api
          .getRandomContext(
            this.state.task.id,
            this.state.task.cur_round,
            [],
            this.state.task.context
          )
          .then(
            (result) => {
              const randomTargetModel =
                this.state.task.round.url !== null
                  ? this.pickModel(this.state.task.round.url)
                  : null;
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
                  expandedOutput.push(
                    JSON.parse(JSON.stringify(expandedObj[0]))
                  );
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

              getModelInTheLoop(this.state.task.id)
                .then((res) => {
                  this.setState({ modelInTheLoop: res.data.light_model });
                })
                .then(() => {
                  this.setState({
                    taskConfig: taskConfig,
                    randomTargetModel: randomTargetModel,
                    data: Object.assign(
                      {},
                      initializeData(taskConfig.input),
                      JSON.parse(result.context_json)
                    ),
                    context: result,
                    content: [],
                    submitDisabled: false,
                    refreshDisabled: false,
                    loading: false,
                  });
                });
            },
            (error) => {
              this.setState({
                contextLoadError: true,
                loading: false,
              });
              console.log(error);
            }
          );
      }
    );
  }

  updateRetainInput(e) {
    const retainInput = e.target.checked;
    if (this.context.api.loggedIn()) {
      var settings;
      if (this.context.user.settings_json) {
        settings = JSON.parse(this.context.user.settings_json);
        settings["retain_input"] = retainInput;
      } else {
        settings = { retain_input: retainInput };
      }
      this.context.user.settings_json = JSON.stringify(settings);
      this.context.api.updateUser(this.context.user.id, this.context.user);
    }
    this.setState({ retainInput: retainInput });
  }

  pickModel = (modelUrls) => {
    const models = modelUrls.split("|");
    const model = models[Math.floor(Math.random() * models.length)];
    return model;
  };

  manageTextInput = (action) => {
    if (this.inputRef.current) {
      if (action === "focus") {
        this.inputRef.current.focus();
      } else if (action === "blur") {
        this.inputRef.current.blur();
      }
    }
  };

  smoothlyAnimateToBottom() {
    if (this.bottomAnchorRef.current) {
      this.bottomAnchorRef.current.scrollIntoView({
        block: "end",
        behavior: "smooth",
      });
    }
  }

  storeExampleWrapper(
    signature = null,
    modelWrong = null,
    output = null,
    endpoint = null,
    metadata = {},
    callback = () => this.smoothlyAnimateToBottom()
  ) {
    this.setState(
      {
        content: [
          ...this.state.content,
          {
            livemode: this.state.livemode,
            modelWrong: modelWrong,
            input: this.getInputData(),
            output: output,
            modelInTheLoop: this.state.modelInTheLoop,
            retracted: false,
          },
        ],
      },
      () => {
        if (!this.state.livemode) {
          if (!this.state.retainInput) {
            this.initializeDataWrapper();
          }
          this.setState(
            {
              submitDisabled: false,
              refreshDisabled: false,
            },
            callback
          );
          return;
        }

        // Save examples.
        return this.context.api
          .storeExample(
            this.state.task.id,
            this.state.task.cur_round,
            this.context.user.id,
            this.state.context.id,
            this.getInputData(),
            output,
            signature,
            metadata,
            modelWrong,
            null,
            endpoint
          )
          .then(
            (storeExampleResult) => {
              var key = this.state.content.length;
              // Reset state variables and store example id.
              this.setState(
                {
                  submitDisabled: false,
                  refreshDisabled: false,
                  mapKeyToExampleId: {
                    ...this.state.mapKeyToExampleId,
                    [key]: storeExampleResult.id,
                  },
                },
                callback
              );

              if (!!storeExampleResult.badges) {
                this.setState({
                  showBadges: storeExampleResult.badges,
                });
              }
              if (!this.state.retainInput) {
                this.initializeDataWrapper();
              }
            },
            (error) => {
              console.log(error);
              this.setState({
                submitDisabled: false,
                refreshDisabled: false,
              });
            }
          );
      }
    );
  }

  handleResponse(e) {
    e.preventDefault();
    var incompleteExample = false;
    this.state.taskConfig.input.forEach((taskConfigObj) => {
      if (this.state.data[taskConfigObj.name] === null) {
        this.setState({ submitWithoutFullExample: true });
        incompleteExample = true;
      }
    });
    if (incompleteExample) {
      return;
    }

    this.setState({ submitWithoutFullExample: false });
    this.setState({ submitDisabled: true, refreshDisabled: true }, () => {
      this.manageTextInput("blur");
      const url = this.state.modelInTheLoop;
      if (url === null) {
        // In this case, there is no target model. Just store the example without model data.
        this.storeExampleWrapper();
        return;
      }
      this.context.api
        .convertToModelIO(this.state.task.id, this.state.data)
        .then((model_io_result) => {
          // Begin hack that can be removed upon full dynalab integration
          if (this.state.task.task_code === "vqa") {
            model_io_result = this.state.data;
            model_io_result["image_url"] = model_io_result["image"];
          }
          // End hack that can be removed upon full dynalab integration
          this.context.api.getModelResponse(url, model_io_result).then(
            (modelResponseResult) => {
              if (modelResponseResult.errorMessage) {
                this.setState({
                  submitDisabled: false,
                  refreshDisabled: false,
                  fetchPredictionError: true,
                });
              } else {
                if (this.state.fetchPredictionError) {
                  this.setState({
                    fetchPredictionError: false,
                  });
                }
                const output = deepCopyJSON(modelResponseResult);
                const target = {};
                for (const taskConfigObj of this.state.taskConfig.output) {
                  if (this.state.data.hasOwnProperty(taskConfigObj.name)) {
                    target[taskConfigObj.name] =
                      this.state.data[taskConfigObj.name];
                  }
                }
                this.context.api
                  .getModelWrong(this.state.task.id, target, output)
                  .then(
                    (modelWrongResult) =>
                      this.storeExampleWrapper(
                        modelResponseResult["signed"]
                          ? modelResponseResult["signed"]
                          : modelResponseResult["signature"], // TODO: pre-dynatask models use signed, post-dynatask models use signature. Make this cleaner somehow?
                        modelWrongResult.model_wrong,
                        output,
                        url
                      ),
                    (error) => {
                      console.log(error);
                      this.setState({
                        submitDisabled: false,
                        refreshDisabled: false,
                        fetchPredictionError: true,
                      });
                    }
                  )
                  .then(() => this.smoothlyAnimateToBottom());
              }
            },
            (error) => {
              console.log(error);
              if (error && error.message && error.message === "Unauthorized") {
                this.props.history.push(
                  "/login?msg=" +
                    encodeURIComponent(
                      "You need to login to use this feature."
                    ) +
                    "&src=" +
                    encodeURIComponent(`/tasks/${this.state.taskCode}/create`)
                );
              }
              this.setState({
                submitDisabled: false,
                refreshDisabled: false,
              });
            }
          );
        });
    });
  }

  switchLiveMode(checked) {
    if (checked === true) {
      if (!this.context.api.loggedIn()) {
        this.props.history.push(
          "/login?msg=" +
            encodeURIComponent(
              "Please sign up or log in so that you can get credit for your generated examples."
            ) +
            "&src=" +
            encodeURIComponent(`/tasks/${this.state.taskCode}/create`)
        );
      } else {
        this.getNewContext();
      }
    }
    this.setState({ livemode: checked });
  }

  componentDidMount() {
    const propState = this.props.location.state;
    this.setState({
      selectedModel: propState?.detail,
    });
    const {
      match: { params },
    } = this.props;
    if (!this.context.api.loggedIn()) {
      this.context.api.getTrialAuthToken();
    }
    if (!this.context.api.loggedIn() || propState?.detail) {
      this.setState({ livemode: false });
    } else {
      const user = this.context.api.getCredentials();
      this.context.api.getUser(user.id, true).then(
        (result) => {
          if (result.settings_json) {
            var settings = JSON.parse(result.settings_json);
            if (settings["retain_input"]) {
              this.setState({ retainInput: settings["retain_input"] });
            }
          }
        },
        (error) => {
          console.log(error);
        }
      );
    }

    this.setState({ taskCode: params.taskCode }, function () {
      this.context.api.getTask(this.state.taskCode).then(
        (result) => {
          this.setState(
            { task: result, taskCode: result.task_code },
            function () {
              this.getNewContext();
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

  render() {
    console.log(this.state);
    const responseContent = this.state.content
      .map((item, index) => (
        <ResponseInfo
          taskConfig={this.state.taskConfig}
          key={index}
          index={index}
          exampleId={this.state.mapKeyToExampleId[index + 1]}
          obj={item}
          content={this.state.content}
        />
      ))
      .filter((item) => item !== undefined);
    // sentinel value of undefined filtered out after to preserve index values
    // const rounds = (this.state.task.round && this.state.task.cur_round) || 0;

    function renderTooltip(props, text) {
      return (
        <Tooltip id="button-tooltip" {...props}>
          {text}
        </Tooltip>
      );
    }
    function renderSandboxTooltip(props) {
      return renderTooltip(props, "Switch in and out of sandbox mode.");
    }
    function renderSwitchContextTooltip(props) {
      return renderTooltip(props, "Don't like this context? Try another one.");
    }

    // The multiclass type is special when as_goal_message is true. We want this
    // object to appear in a special place in the interface.
    const goalMessageInterface = this.state.taskConfig?.input
      .filter(
        (taskConfigObj) =>
          taskConfigObj.type === "multiclass" && taskConfigObj.as_goal_message
      )
      .map((taskConfigObj) => (
        <div key={taskConfigObj.name} className="mt-1 mb-1">
          <AnnotationComponent
            displayName={taskConfigObj.display_name}
            className="user-input-primary"
            key={taskConfigObj.name}
            create={true}
            name={taskConfigObj.name}
            data={this.state.data}
            setData={(data) => this.setState({ data: data })}
            type={taskConfigObj.type}
            configObj={taskConfigObj}
            inputReminder={
              this.state.data[taskConfigObj.name] === null &&
              this.state.submitWithoutFullExample
            }
          />
        </div>
      ));

    // The context_string_selection type is special. When it is present, we want
    // to remove the context string from view and put the context_string_selection
    // in its place
    const contextStringSelectionGroup = this.state.taskConfig?.input.filter(
      (taskConfigObj) => taskConfigObj.type === "context_string_selection"
    );
    const selectableContexts = contextStringSelectionGroup?.map(
      (taskConfigObj) => taskConfigObj.reference_name
    );
    const tooTallForResponseInfoPlaceholder = this.state.taskConfig?.context
      .concat(this.state.taskConfig?.input)
      .map((taskConfigObj) => taskConfigObj.type)
      .includes("image");
    const contextInterface = this.state.taskConfig?.context
      .concat(contextStringSelectionGroup)
      .filter(
        (taskConfigObj) => !selectableContexts.includes(taskConfigObj.name)
      )
      .map((taskConfigObj) => (
        <div key={taskConfigObj.name} className="mt-1 mb-1">
          <AnnotationComponent
            displayName={taskConfigObj.display_name}
            className={"name-display-primary"}
            key={taskConfigObj.name}
            create={
              taskConfigObj.type === "context_string_selection" ? true : false
            }
            name={taskConfigObj.name}
            data={this.state.data}
            setData={(data) => this.setState({ data: data })}
            type={taskConfigObj.type}
            configObj={taskConfigObj}
            inputReminder={
              this.state.data[taskConfigObj.name] === null &&
              this.state.submitWithoutFullExample
            }
          />
        </div>
      ));

    const belowModelResponseInterface = this.state.taskConfig?.input
      .filter(
        (taskConfigObj) =>
          taskConfigObj.type !== "context_string_selection" &&
          !(
            taskConfigObj.type === "multiclass" && taskConfigObj.as_goal_message
          )
      )
      .map((taskConfigObj) => (
        <div key={taskConfigObj.name} className="mt-1 mb-1">
          <AnnotationComponent
            displayName={taskConfigObj.display_name}
            className="user-input-primary"
            key={taskConfigObj.name}
            create={true}
            name={taskConfigObj.name}
            data={this.state.data}
            setData={(data) => this.setState({ data: data })}
            type={taskConfigObj.type}
            configObj={taskConfigObj}
            inputReminder={
              this.state.data[taskConfigObj.name] === null &&
              this.state.submitWithoutFullExample
            }
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
            <div style={{ float: "right" }}>
              <ButtonGroup>
                <Annotation
                  placement="left"
                  tooltip="Click to show help overlay"
                >
                  <OverlayContext.Consumer>
                    {({ hidden, setHidden }) => (
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm btn-help-info"
                        onClick={() => {
                          setHidden(!hidden);
                        }}
                      >
                        <i className="fas fa-question"></i>
                      </button>
                    )}
                  </OverlayContext.Consumer>
                </Annotation>
                <Annotation
                  placement="bottom"
                  tooltip="Click to learn more details about this task challenge"
                >
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm btn-help-info"
                    onClick={() => {
                      this.setState({ showInfoModal: true });
                    }}
                  >
                    <i className="fas fa-info"></i>
                  </button>
                </Annotation>
                <Annotation
                  placement="top"
                  tooltip="Click to adjust your create settings"
                >
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm btn-help-info"
                    onClick={() => {
                      this.setState({ showCreateSettingsModal: true });
                    }}
                  >
                    <i className="fa fa-cog"></i>
                  </button>
                </Annotation>
              </ButtonGroup>
              <Modal
                show={this.state.showInfoModal}
                onHide={() => this.setState({ showInfoModal: false })}
              >
                <Modal.Header closeButton>
                  <Modal.Title>Instructions</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Markdown>{this.state.task.instructions_md}</Markdown>
                </Modal.Body>
              </Modal>
              <Modal
                show={this.state.showCreateSettingsModal}
                onHide={() => this.setState({ showCreateSettingsModal: false })}
              >
                <Modal.Header closeButton>
                  <Modal.Title>Create Settings</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Form.Check
                    checked={this.state.retainInput}
                    label="Do you want to retain your input for the same context?"
                    onChange={this.updateRetainInput}
                  />
                </Modal.Body>
              </Modal>
            </div>
            <AnnotationTitle
              taskName={this.state.task.name}
              selectedModel={this.state.selectedModel}
              randomTargetModel={this.state.randomTargetModel}
            />
            <div className={"mb-3"}>
              {(this.state.taskConfig?.goal_message ||
                (goalMessageInterface && goalMessageInterface.length) > 0) && (
                <div className="p-3 mb-1 rounded light-gray-bg">
                  {this.state.taskConfig.goal_message && (
                    <InputGroup className="align-items-center">
                      <i className="mr-1 fas fa-flag-checkered"></i>
                      Your goal: {this.state.taskConfig.goal_message}
                    </InputGroup>
                  )}
                  {goalMessageInterface}
                </div>
              )}
            </div>
            <Card className="profile-card">
              {this.state.loading ? (
                <div className="mx-auto my-3">
                  <Spinner animation="border" />{" "}
                </div>
              ) : this.state.contextLoadError ? (
                <Card.Body className="p-3">
                  <Row>
                    <Col>
                      <p>
                        There are no contexts available. Reach out to the owner
                        of this task.
                      </p>
                    </Col>
                  </Row>
                </Card.Body>
              ) : (
                <>
                  {contextInterface && contextInterface.length > 0 && (
                    <div className="p-3 mb-1 rounded light-gray-bg">
                      {contextInterface}
                    </div>
                  )}
                  <Card.Body
                    className="pt-2 overflow-auto"
                    style={{
                      height: tooTallForResponseInfoPlaceholder ? "auto" : 385,
                    }}
                    ref={this.chatContainerRef}
                  >
                    {responseContent}
                    <div className="bottom-anchor" ref={this.bottomAnchorRef} />
                  </Card.Body>
                  <div className="p-3 mb-1">{belowModelResponseInterface}</div>
                  <Form>
                    <Row className="p-3">
                      <Col xs={6}>
                        <InputGroup>
                          {!this.state.selectedModel && (
                            <OverlayTrigger
                              placement="bottom"
                              delay={{ show: 250, hide: 400 }}
                              overlay={renderSandboxTooltip}
                            >
                              <span style={{ marginRight: 10 }}>
                                <Annotation
                                  placement="left"
                                  tooltip="If you want to just play around without storing your examples, you can switch to Sandbox mode here."
                                >
                                  <BootstrapSwitchButton
                                    checked={this.state.livemode}
                                    onlabel="Live Mode"
                                    onstyle="primary principal-color-bg"
                                    offstyle="warning"
                                    offlabel="Sandbox"
                                    width={120}
                                    onChange={(checked) => {
                                      this.switchLiveMode(checked);
                                    }}
                                  />
                                </Annotation>
                              </span>
                            </OverlayTrigger>
                          )}
                        </InputGroup>
                      </Col>
                      <Col xs={6}>
                        <InputGroup className="d-flex justify-content-end">
                          <Annotation
                            placement="top"
                            tooltip="When you’re done, you can submit the example and we’ll find out what the model thinks!"
                          >
                            <Button
                              type="submit"
                              className="mr-2 border-0 font-weight-bold light-gray-bg task-action-btn"
                              onClick={(e) => {
                                e.preventDefault();
                                this.setState({ showCreateBatchModal: true });
                              }}
                            >
                              {"Batch submissions "}
                              <i
                                className={
                                  this.state.submitDisabled
                                    ? "fa fa-cog fa-spin"
                                    : ""
                                }
                              />
                            </Button>
                          </Annotation>
                          {this.state.showCreateBatchModal && (
                            <>
                              <Modal
                                show={this.state.showCreateBatchModal}
                                onHide={() => {
                                  this.setState({
                                    showCreateBatchModal: false,
                                  });
                                }}
                              >
                                <BatchCreateSamples
                                  modelUrl={this.state.modelInTheLoop}
                                />
                              </Modal>
                            </>
                          )}
                          {this.state.taskConfig &&
                            this.state.taskConfig.context.length !== 0 && (
                              <OverlayTrigger
                                placement="bottom"
                                delay={{ show: 250, hide: 400 }}
                                overlay={renderSwitchContextTooltip}
                              >
                                <Annotation
                                  placement="left"
                                  tooltip="Don’t like this context? Try another one."
                                >
                                  <Button
                                    className="border-0 font-weight-bold light-gray-bg task-action-btn"
                                    onClick={this.getNewContext}
                                    disabled={this.state.refreshDisabled}
                                  >
                                    Switch to next context
                                  </Button>
                                </Annotation>
                              </OverlayTrigger>
                            )}
                          <Annotation
                            placement="top"
                            tooltip="When you’re done, you can submit the example and we’ll find out what the model thinks!"
                          >
                            <Button
                              type="submit"
                              className="ml-2 border-0 font-weight-bold light-gray-bg task-action-btn"
                              onClick={this.handleResponse}
                              disabled={this.state.submitDisabled}
                            >
                              {"Submit "}
                              <i
                                className={
                                  this.state.submitDisabled
                                    ? "fa fa-cog fa-spin"
                                    : ""
                                }
                              />
                            </Button>
                          </Annotation>
                        </InputGroup>
                      </Col>
                    </Row>
                  </Form>
                  <div className="p-2">
                    {!this.state.livemode && (
                      <p style={{ color: "red" }}>
                        WARNING: You are in "just playing" sandbox mode. Your
                        examples are not saved.
                      </p>
                    )}
                    {this.state.selectedModel && (
                      <p style={{ color: "red" }}>
                        WARNING: You are talking to a user-uploaded model. You
                        cannot switch out of sandbox mode.
                      </p>
                    )}
                    {this.state.fetchPredictionError && (
                      <span style={{ color: "#e65959" }}>
                        *Unable to fetch results. Please try again after
                        sometime.
                      </span>
                    )}
                  </div>
                </>
              )}
            </Card>
          </Col>
        </Container>
      </OverlayProvider>
    );
  }
}

export default CreateInterface;
