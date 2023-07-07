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

import React, { useState, useContext } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Dropdown,
  DropdownButton,
  InputGroup,
  Modal,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import Markdown from "react-markdown";
import Moment from "react-moment";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import ChevronExpandButton from "../components/Buttons/ChevronExpandButton";
import FloresGrid from "../components/FloresComponents/FloresGrid";
import { FLORES_TASK_CODES } from "./FloresTaskPage";
import "./ModelPage.css";
import {
  AnonymousStatus,
  DeploymentStatus,
  EvaluationStatus,
} from "./ModelStatus";
import useFetch from "use-http";
import { BadgeOverlay, OverlayProvider } from "./Overlay";
import UserContext from "./UserContext";
import axios from "axios";

const yaml = require("js-yaml");

const EvalStatusRow = ({
  status,
  downloadLog,
  downloadPrediction,
  isModelOwner,
  isAdminOrTaskOwner,
  modelId,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  return (
    <Table hover className="mb-0 hover" style={{ tableLayout: "fixed" }}>
      <tbody>
        <Modal show={showModal} onHide={() => setShowModal(!showModal)}>
          <Modal.Header closeButton>
            <Modal.Title>{status.dataset_name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {status.dataset_longdesc}
            <br />
            <br />
            {status.dataset_source_url && status.dataset_source_url !== "" ? (
              <Button href={status.dataset_source_url}>
                <i className="fas fa-newspaper"></i> Read Paper
              </Button>
            ) : (
              ""
            )}
          </Modal.Body>
        </Modal>
        <tr key={status.dataset_name}>
          <td>
            <span
              onClick={() => setShowModal(!showModal)}
              className="btn-link dataset-link"
            >
              {status.dataset_name}
            </span>{" "}
          </td>
          <td className="text-right t-2" key={`status-${status.dataset_name}`}>
            {(isAdminOrTaskOwner ||
              (status.dataset_log_access_type === "user" && isModelOwner)) && (
              <>
                <Button
                  className="logs-button"
                  variant="outline-primary"
                  size="sm"
                  disabled={showSpinner}
                  onClick={() => {
                    setShowSpinner(
                      true,
                      downloadLog(modelId, status.dataset_id).then(
                        (result) => {
                          setShowSpinner(false);
                        },
                        (error) => {
                          console.log(error);
                          setShowSpinner(false);
                        }
                      )
                    );
                  }}
                >
                  {showSpinner ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <i className="fas fa-file-download">
                      {" "}
                      <span className="name-buttons">Logs</span>
                    </i>
                  )}
                </Button>
                <Button
                  variant="outline-primary"
                  size="sm"
                  disabled={showSpinner}
                  onClick={() => {
                    setShowSpinner(
                      true,
                      downloadPrediction(modelId, status.dataset_id).then(
                        (result) => {
                          setShowSpinner(false);
                        },
                        (error) => {
                          console.log(error);
                          setShowSpinner(false);
                        }
                      )
                    );
                  }}
                >
                  {showSpinner ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <i className="fas fa-file-download">
                      {" "}
                      <span className="name-buttons">Pred</span>
                    </i>
                  )}
                </Button>
              </>
            )}{" "}
            <span className="result_metric">
              <EvaluationStatus evaluationStatus={status.evaluation_status} />
            </span>
          </td>
        </tr>
      </tbody>
    </Table>
  );
};

const ScoreRow = ({
  score,
  downloadLog,
  downloadPrediction,
  isModelOwner,
  isAdminOrTaskOwner,
  modelId,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const { post, response } = useFetch();
  const { user } = useContext(UserContext);
  const perf_by_tag =
    score.metadata_json &&
    JSON.parse(score.metadata_json).hasOwnProperty("perf_by_tag")
      ? JSON.parse(score.metadata_json)["perf_by_tag"]
      : [];

  const downloadPrection = async (datasetId) => {
    setShowSpinner(true);
    await post(
      "/model/get_model_prediction_per_dataset",
      {
        user_id: user.id,
        model_id: modelId,
        dataset_id: datasetId,
      },
      {
        responseType: "blob",
      }
    );
    if (response.ok) {
      setShowSpinner(false);
      response.blob().then((blob) => {
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${modelId}_prediction.jsonl.out`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      });
    } else {
      setShowSpinner(false);
      Swal.fire({
        title: "Oh no!!",
        text: "Something went wrong while downloading the prediction file",
        icon: "warning",
      });
    }
  };

  const clickable = perf_by_tag.length !== 0;

  return (
    <Table hover className="mb-0 hover" style={{ tableLayout: "fixed" }}>
      <tbody>
        <Modal show={showModal} onHide={() => setShowModal(!showModal)}>
          <Modal.Header closeButton>
            <Modal.Title>{score.dataset_name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {score.dataset_longdesc}
            <br />
            <br />
            {score.dataset_source_url && score.dataset_source_url !== "" ? (
              <Button href={score.dataset_source_url}>
                <i className="fas fa-newspaper"></i> Read Paper
              </Button>
            ) : (
              ""
            )}
          </Modal.Body>
        </Modal>
        <tr key={score.dataset_name}>
          <td>
            <span
              onClick={() => setShowModal(!showModal)}
              className="btn-link dataset-link"
            >
              {expanded ? <b>{score.dataset_name}</b> : score.dataset_name}
            </span>{" "}
            {clickable ? (
              <div
                style={{ float: "right" }}
                onClick={() => (clickable ? setExpanded(!expanded) : "")}
              >
                <ChevronExpandButton
                  expanded={expanded}
                  onClick={() => (clickable ? setExpanded(!expanded) : "")}
                  containerClassName={"position-absolute start-100"}
                />
              </div>
            ) : (
              ""
            )}
          </td>
          <td
            colSpan={2}
            className="text-right t-2"
            key={`score-${score.dataset_name}-overall`}
          >
            {(isAdminOrTaskOwner ||
              (score.dataset_log_access_type === "user" && isModelOwner)) && (
              <>
                <Button
                  variant="outline-primary"
                  size="sm"
                  disabled={showSpinner}
                  onClick={() => {
                    downloadPrection(score.dataset_id);
                  }}
                >
                  {showSpinner ? (
                    <>
                      <Spinner animation="border" size="sm" />
                    </>
                  ) : (
                    <>
                      <i className="fas fa-file-download">
                        {" "}
                        <span className="name-buttons">Pred</span>
                      </i>
                    </>
                  )}
                </Button>
              </>
            )}{" "}
            <span className="result_metric">
              {expanded ? (
                <b>
                  {parseFloat(score.accuracy).toFixed(2) +
                    (score.perf_std !== null ? "\xB1" + score.perf_std : "")}
                </b>
              ) : (
                parseFloat(score.accuracy).toFixed(2) +
                (score.perf_std !== null ? "\xB1" + score.perf_std : "")
              )}
            </span>
          </td>
        </tr>
        {expanded &&
          perf_by_tag.map((perf_and_tag, index) => {
            return (
              <tr key={index} style={{ border: `none` }}>
                <td className="pr-4 text-right text-nowrap">
                  <div className="d-flex justify-content-end align-items-center">
                    <span className="d-flex align-items-center">
                      {perf_and_tag.tag}&nbsp;
                    </span>
                  </div>
                </td>
                <td
                  className="text-right "
                  key={`score-${score.dataset_name}-${perf_and_tag.tag}-overall`}
                >
                  <span>
                    {parseFloat(perf_and_tag.perf_dict.chrf_pp).toFixed(2) +
                      (score.perf_std !== null ? "\xB1" + score.perf_std : "")}
                    &nbsp;
                  </span>
                </td>
                <td
                  className="text-right "
                  key={`score-${score.dataset_name}-${perf_and_tag.tag}-overall`}
                >
                  <span>
                    {parseFloat(perf_and_tag.perf_dict.sp_bleu).toFixed(2) +
                      (score.perf_std !== null ? "\xB1" + score.perf_std : "")}
                    &nbsp;
                  </span>
                </td>
                <td
                  className="text-right "
                  key={`score-${score.dataset_name}-${perf_and_tag.tag}-overall`}
                >
                  <span>
                    {parseFloat(perf_and_tag.perf_dict.sp_bleu).toFixed(2) +
                      (score.perf_std !== null ? "\xB1" + score.perf_std : "")}
                  </span>
                </td>
              </tr>
            );
          })}
      </tbody>
    </Table>
  );
};

class ModelPage extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      ctxUserId: null,
      modelId: this.props.match.params.modelId,
      model: {
        name: "",
        username: "",
      },
      taskCode: null,
      task: {},
      isLoading: false,
      modelDeployed: false,
      isAdminOrTaskOwner: false,
    };
  }

  componentDidMount() {
    this.setState({ isLoading: true });
    const user = this.context.api.getCredentials();
    this.setState({ ctxUserId: user.id });
    this.fetchModel();
  }

  fetchModel = () => {
    this.context.api.getModel(this.state.modelId).then(
      (result) => {
        this.setState({ model: result, isLoading: false }, function () {
          this.context.api
            .getTask(this.state.model.tid)
            .then(
              (result) => {
                this.setState({
                  taskCode: result.task_code,
                  task: result,
                });
                const taskCodeFromParams = this.props.match.params.taskCode;
                if (
                  taskCodeFromParams &&
                  taskCodeFromParams !== result.task_code
                ) {
                  this.props.history.replace({
                    pathname: this.props.location.pathname.replace(
                      `/tasks/${taskCodeFromParams}`,
                      `/tasks/${result.task_code}`
                    ),
                    search: this.props.location.search,
                  });
                }
              },
              (error) => {
                console.log(error);
              }
            )
            .then(
              this.context.api.getAdminOrOwner(this.state.model.tid).then(
                (adminOrOwnerResult) => {
                  this.setState({
                    isAdminOrTaskOwner: adminOrOwnerResult.admin_or_owner,
                  });
                },
                (error) => {
                  console.log(error);
                }
              )
            );
        });
      },
      (error) => {
        console.log(error);
        this.setState({ isLoading: false });
        if (error.status_code === 404 || error.status_code === 405) {
          this.props.history.push("/");
        }
      }
    );
  };

  handleEdit = () => {
    this.props.history.push({
      pathname: `/tasks/${this.state.taskCode}/models/${this.state.model.id}/updateModelInfo`,
      state: { detail: this.state.model },
    });
  };

  handleInteract = () => {
    this.props.history.push({
      pathname: `/tasks/${this.state.taskCode}/create`,
      state: {
        detail: {
          endpointUrl: this.state.model.light_model,
          name: this.state.model.name,
          mid: this.state.model.id,
        },
      },
    });
  };

  handleDeployModel = () => {
    return this.context.api.deployModel(this.state.modelId).then(
      (result) => {
        this.setState({
          modelDeployed: true,
        });
      },
      (error) => {
        console.log(error);
      }
    );
  };

  togglePublish = () => {
    const modelName = this.state.model.name;
    const BASE_URL_2 = process.env.REACT_APP_API_HOST_2;
    if (!modelName || modelName === "") {
      this.props.history.push({
        pathname: `/tasks/${this.state.taskCode}/models/${this.state.model.id}/updateModelInfo`,
        state: { detail: this.state.model },
      });
      return;
    }

    return axios
      .get(`${BASE_URL_2}/model/update_model_status/${this.state.modelId}`)
      .then((res) => {
        if (res.status === 200) {
          Swal.fire({
            icon: "success",
            title: "Model status change",
            text: "Model status has been update successfully",
            showConfirmButton: false,
            timer: 1500,
          });
          window.location.reload();
        } else {
          Swal.fire({
            icon: "error",
            title: "Model status change",
            text: "Model status change failed",
            showConfirmButton: false,
            timer: 1500,
          });
        }
      });

    // return this.context.api.toggleModelStatus(this.state.modelId).then(
    //   (result) => {
    //     if (!!result.badges) {
    //       this.setState({ showBadges: result.badges })
    //     }
    //     this.fetchModel()
    //   },
    //   (error) => {
    //     console.log(error)
    //   },
    // )
  };

  handleBack = () => {
    const propState = this.props.location.state;
    if (propState && propState.src === "updateModelInfo") {
      this.props.history.push("/account#models");
    } else {
      this.props.history.goBack();
    }
  };

  escapeLatexCharacters = (strToEscape) => {
    const escapes = {
      "{": "\\{",
      "}": "\\}",
      "#": "\\#",
      $: "\\$",
      "%": "\\%",
      "&": "\\&",
      "^": "\\textasciicircum{}",
      _: "\\_",
      "~": "\\textasciitilde{}",
      "\\": "\\textbackslash{}",
    };
    const regex = new RegExp(`[${Object.keys(escapes).join("")}\\]`);
    return strToEscape.replace(regex, (match) => escapes[match]);
  };

  processScoresArrayForLatex = (scoresArr) => {
    let tableContentForScores = "";
    scoresArr = (scoresArr || []).sort((a, b) => b.accuracy - a.accuracy);
    scoresArr.forEach((score) => {
      tableContentForScores += `        ${this.escapeLatexCharacters(
        score.dataset_name
      )} & ${score.accuracy} \\\\\n`;
    });
    return tableContentForScores;
  };

  downloadLatex = () => {
    let { leaderboard_scores, non_leaderboard_scores, name } = this.state.model;
    const { task } = this.state;
    const taskName = task.name;

    let latexTableContent = "";

    latexTableContent += this.processScoresArrayForLatex(leaderboard_scores);
    latexTableContent += this.processScoresArrayForLatex(
      non_leaderboard_scores
    );

    const modelUrl = window.location.href;

    let latexDocStr = `\\documentclass{article}
\\usepackage{hyperref}
\\usepackage{booktabs}

\\begin{document}

\\begin{table}[]
    \\centering
    \\begin{tabular}{l|r}
        \\toprule
        \\textbf{Dataset} & \\textbf{${this.escapeLatexCharacters(
          task.perf_metric_field_name
        )}} \\\\
        \\midrule
${latexTableContent}
        \\bottomrule
    \\end{tabular}
    \\caption{${this.escapeLatexCharacters(
      taskName
    )} results: \\url{${modelUrl}}}
    \\label{tab:results}
\\end{table}

\\end{document}`;

    const latexContent =
      "data:application/x-latex;charset=utf-8," + latexDocStr;

    const encodedUri = encodeURI(latexContent);
    const csvLink = document.createElement("a");
    csvLink.setAttribute("href", encodedUri);
    csvLink.setAttribute("download", name + "-" + taskName + ".tex");
    document.body.appendChild(csvLink);
    csvLink.click();
    document.body.removeChild(csvLink);
  };

  processScoresArrayForCsv = (csvRows, scoresArr, datasetType) => {
    scoresArr = (scoresArr || []).sort((a, b) => b.accuracy - a.accuracy);
    scoresArr.forEach((score) => {
      csvRows.push([score.dataset_name, datasetType, score.accuracy]);
    });
  };

  downloadCsv = () => {
    const { leaderboard_scores, non_leaderboard_scores, name } =
      this.state.model;
    const { task } = this.state;
    const taskName = task.name;

    const rows = [];
    rows.push(["dataset-name", "dataset-type", task.perf_metric_field_name]);
    this.processScoresArrayForCsv(rows, leaderboard_scores, "leaderboard");
    this.processScoresArrayForCsv(
      rows,
      non_leaderboard_scores,
      "non-leaderboard"
    );

    let csvContent = "data:text/csv;charset=utf-8,";

    rows.forEach((rowArray) => {
      csvContent += rowArray.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const csvLink = document.createElement("a");
    csvLink.setAttribute("href", encodedUri);
    csvLink.setAttribute("download", name + "-" + taskName + ".csv");
    document.body.appendChild(csvLink);
    csvLink.click();
    document.body.removeChild(csvLink);
  };

  render() {
    const { model, task, taskCode } = this.state;

    const config = yaml.load(task.config_yaml);
    const perf_metric_metric_configs = config.perf_metric
      ? config.perf_metric
      : [];

    const isFlores = FLORES_TASK_CODES.slice(1).includes(task.task_code);
    const isModelOwner =
      parseInt(this.state.model.uid) === parseInt(this.state.ctxUserId);

    const { leaderboard_scores } = this.state.model;
    const { non_leaderboard_scores } = this.state.model;
    const { leaderboard_evaluation_statuses } = this.state.model;
    const { non_leaderboard_evaluation_statuses } = this.state.model;
    const { hidden_evaluation_statuses } = this.state.model;
    let orderedLeaderboardScores = (leaderboard_scores || []).sort(
      (a, b) => a.round_id - b.round_id
    );
    let orderedNonLeaderboardScores = (non_leaderboard_scores || []).sort(
      (a, b) => a.round_id - b.round_id
    );
    return (
      <OverlayProvider initiallyHide={true}>
        <BadgeOverlay
          badgeTypes={this.state.showBadges}
          show={!!this.state.showBadges}
          onHide={() => this.setState({ showBadges: "" })}
        ></BadgeOverlay>
        <Container className="pb-5 mb-5">
          <h1 className="pt-3 my-4 text-center text-uppercase">
            Model Overview
          </h1>
          <Col className="m-auto " lg={8}>
            <Card className="profile-card">
              <Card.Body className="mx-6">
                <div className="mt-4 d-flex justify-content-between">
                  <Button
                    className="border-0 font-weight-bold light-gray-bg"
                    aria-label="Back"
                    onClick={this.handleBack}
                  >
                    {"Back"}
                  </Button>
                  <div className="gap-2">
                    {(isModelOwner || model.is_published) &&
                    model.deployment_status === "deployed" ? (
                      <Button
                        variant="border-0 font-weight-bold light-gray-bg"
                        className="mr-2"
                        onClick={() => this.handleInteract()}
                      >
                        <i className="fas fa-pen"></i> Interact
                      </Button>
                    ) : this.state.modelDeployed ? (
                      <Button
                        variant="border-0 font-weight-bold light-gray-bg"
                        disabled={true}
                      >
                        <i className="fas fa-upload"></i> Model Deployed!
                      </Button>
                    ) : (isModelOwner || model.is_published) &&
                      model.deployment_status === "takendownnonactive" ? (
                      <Button
                        variant="border-0 font-weight-bold light-gray-bg"
                        onClick={() => this.handleDeployModel()}
                      >
                        <i className="fas fa-upload"></i> Deploy Model
                      </Button>
                    ) : (
                      ""
                    )}
                    {model.source_url && model.source_url !== "" ? (
                      <Button
                        variant="border-0 font-weight-bold light-gray-bg"
                        href={model.source_url}
                      >
                        <i className="fas fa-newspaper"></i> Read Paper
                      </Button>
                    ) : (
                      ""
                    )}
                    {isModelOwner && (
                      <Button
                        variant="border-0 font-weight-bold light-gray-bg"
                        onClick={() => this.handleEdit()}
                        className="mr-2"
                      >
                        Edit
                      </Button>
                    )}
                    {isModelOwner && model.is_published === true ? (
                      <Button
                        variant="outline-danger"
                        onClick={() => this.togglePublish()}
                      >
                        Unpublish
                      </Button>
                    ) : null}
                    {isModelOwner &&
                    model.is_published === false &&
                    model.name ? (
                      <Button
                        variant="outline-success"
                        onClick={() => this.togglePublish()}
                      >
                        Publish
                      </Button>
                    ) : null}
                  </div>
                </div>
                {model.id ? (
                  <InputGroup>
                    <Table className="mt-8 mb-4">
                      <thead />
                      <tbody>
                        <tr>
                          <td colSpan="2" className="p-6 text-base">
                            <h5 className="mx-0">
                              <span>{model.name || "Unknown"}</span>
                              <span className="float-right">
                                uploaded{" "}
                                <Moment utc fromNow>
                                  {model.upload_datetime}
                                </Moment>
                              </span>
                              {isModelOwner && model.is_published === "True" ? (
                                <Badge variant="success" className="ml-2">
                                  Published
                                </Badge>
                              ) : null}
                              {isModelOwner &&
                              model.is_published === "False" ? (
                                <Badge variant="danger" className="ml-2">
                                  Unpublished
                                </Badge>
                              ) : null}
                            </h5>
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                    <Table hover responsive className="mb-0">
                      <thead />
                      <tbody>
                        {isModelOwner && (
                          <tr style={{ border: `none` }}>
                            <td className="p-6 text-base">Owner Anonymity</td>
                            <td className="flex justify-end p-6 text-base">
                              <AnonymousStatus
                                anonymousStatus={model.is_anonymous}
                              />
                            </td>
                          </tr>
                        )}
                        <tr style={{ border: `none` }}>
                          <td className="p-6 text-base">Deployment Status</td>
                          <td className="flex justify-end p-6 text-base">
                            <DeploymentStatus
                              deploymentStatus={model.deployment_status}
                            />
                          </td>
                        </tr>
                        <tr style={{ border: `none` }}>
                          <td className="p-6 text-base">Owner</td>
                          <td className="flex justify-end p-6 text-base">
                            {model.uid ? (
                              <span>
                                <Link to={`/users/${model.uid}`}>
                                  {model.username}
                                </Link>
                                {model.is_anonymous ? (
                                  <i>
                                    {" "}
                                    (will be displayed as <b>anonymous</b> to
                                    other users)
                                  </i>
                                ) : null}
                              </span>
                            ) : (
                              "anonymous"
                            )}
                          </td>
                        </tr>
                        {!isFlores && (
                          <tr style={{ border: `none` }}>
                            <td className="p-6 text-base">Task</td>
                            <td className="flex justify-end p-6 text-base">
                              <Link to={`/tasks/${taskCode}`}>{taskCode}</Link>
                            </td>
                          </tr>
                        )}
                        <tr style={{ border: `none` }}>
                          <td className="p-6 text-base ">Summary</td>
                          <td className="flex justify-end p-6 text-base">
                            {model.longdesc}
                          </td>
                        </tr>
                        <tr style={{ border: `none` }}>
                          <td
                            className="p-6 text-base"
                            style={{ whiteSpace: "nowrap" }}
                          >
                            # Parameters
                          </td>
                          <td className="flex justify-end p-6 text-base">
                            {model.params}
                          </td>
                        </tr>
                        {!isFlores && (
                          <tr style={{ border: `none` }}>
                            <td className="p-6 text-base">Language(s)</td>
                            <td className="flex justify-end p-6 text-base">
                              {" "}
                              {model.languages}
                            </td>
                          </tr>
                        )}
                        <tr style={{ border: `none` }}>
                          <td className="p-6 text-base">License(s)</td>
                          <td className="p-6 text-base">{model.license}</td>
                        </tr>
                        <tr style={{ border: `none` }}>
                          <td
                            className="p-6 text-base"
                            style={{ verticalAlign: "middle" }}
                          >
                            Model Card
                          </td>
                          <td className="flex justify-end p-6 text-base modelCard">
                            <Markdown>{model.model_card}</Markdown>
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                    {orderedLeaderboardScores.length > 0 ||
                    orderedNonLeaderboardScores.length ? (
                      <span className={"w-100 mt-5 mx-4"}>
                        <DropdownButton
                          alignRight={true}
                          variant="outline-primary"
                          className="float-right mr-2 border-0 font-weight-bold light-gray-bg"
                          title={"Export"}
                        >
                          <Dropdown.Item onClick={this.downloadCsv}>
                            {"CSV"}
                          </Dropdown.Item>
                          <Dropdown.Item onClick={this.downloadLatex}>
                            {"LaTeX"}
                          </Dropdown.Item>
                        </DropdownButton>
                      </span>
                    ) : (
                      ""
                    )}
                    {orderedLeaderboardScores.length > 0 ||
                    leaderboard_evaluation_statuses.length ? (
                      <Table>
                        <tbody>
                          <tr>
                            <td className="p-6 text-base" colSpan={2}>
                              <h5>Leaderboard Datasets</h5>
                            </td>
                          </tr>
                          <tr>
                            <td className="p-6 text-base">
                              <div className="parent">
                                <label className="child2">
                                  <b>{perf_metric_metric_configs.type}</b>
                                </label>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    ) : (
                      ""
                    )}
                    {orderedLeaderboardScores.map((score, index) => (
                      <ScoreRow
                        key={index}
                        score={score}
                        downloadLog={this.context.api.exportDatasetLog}
                        downloadPrediction={this.context.api.exportPrediction}
                        isModelOwner={isModelOwner}
                        isAdminOrTaskOwner={this.state.isAdminOrTaskOwner}
                        modelId={this.state.modelId}
                      />
                    ))}
                    {leaderboard_evaluation_statuses.map((status, index) => (
                      <EvalStatusRow
                        key={index}
                        status={status}
                        downloadLog={this.context.api.exportDatasetLog}
                        downloadPrediction={this.context.api.exportPrediction}
                        isModelOwner={isModelOwner}
                        isAdminOrTaskOwner={this.state.isAdminOrTaskOwner}
                        modelId={this.state.modelId}
                      />
                    ))}
                    {orderedNonLeaderboardScores.length > 0 ||
                    non_leaderboard_evaluation_statuses.length ? (
                      <Table>
                        <tbody>
                          <tr>
                            <td className="p-6 text-base" colSpan={3}>
                              <h5>Non-Leaderboard Datasets</h5>
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    ) : (
                      ""
                    )}
                    {orderedNonLeaderboardScores.map((score, index) => (
                      <ScoreRow
                        key={index}
                        score={score}
                        downloadLog={this.context.api.exportDatasetLog}
                        downloadPrediction={this.context.api.exportPrediction}
                        isModelOwner={isModelOwner}
                        isAdminOrTaskOwner={this.state.isAdminOrTaskOwner}
                        modelId={this.state.modelId}
                      />
                    ))}
                    {non_leaderboard_evaluation_statuses.map(
                      (status, index) => (
                        <EvalStatusRow
                          key={index}
                          status={status}
                          downloadLog={this.context.api.exportDatasetLog}
                          downloadPrediction={this.context.api.exportPrediction}
                          isModelOwner={isModelOwner}
                          isAdminOrTaskOwner={this.state.isAdminOrTaskOwner}
                          modelId={this.state.modelId}
                        />
                      )
                    )}
                    {hidden_evaluation_statuses.length ? (
                      <Table>
                        <tbody>
                          <tr>
                            <td className="p-6 text-base" colSpan={2}>
                              <h5>
                                Hidden Dataset Incomplete Evaluation Statuses
                              </h5>
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                    ) : (
                      ""
                    )}
                    {hidden_evaluation_statuses.map((status, index) => (
                      <EvalStatusRow key={index} status={status} />
                    ))}
                  </InputGroup>
                ) : (
                  <Container>
                    <Row>
                      <Col className="my-4 text-center">Loading</Col>
                    </Row>
                    <Row>
                      <Col className="mb-4 text-center">
                        {this.state.isLoading && <Spinner animation="border" />}
                      </Col>
                    </Row>
                  </Container>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Container>
        {isFlores && (
          <>
            <Container>
              <hr />
            </Container>
            <FloresGrid model={model} />
          </>
        )}
      </OverlayProvider>
    );
  }
}

export default ModelPage;
