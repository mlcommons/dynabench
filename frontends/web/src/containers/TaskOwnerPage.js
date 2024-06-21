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
import { Container, Row, Col, Nav, Card } from "react-bootstrap";
import UserContext from "./UserContext";
import Advanced from "../components/TaskOwnerPageComponents/Advanced";
import Models from "../components/TaskOwnerPageComponents/Models";
import Owners from "../components/TaskOwnerPageComponents/Owners";
import Rounds from "../components/TaskOwnerPageComponents/Rounds";
import Settings from "../components/TaskOwnerPageComponents/Settings";
import Datasets from "../components/TaskOwnerPageComponents/Datasets";
import Instructions from "new_front/pages/Task/TaskOwnerPage/Instructions";
import ExamplesCreated from "new_front/pages/Task/TaskOwnerPage/ExamplesCreated";
const yaml = require("js-yaml");

class TaskOwnerPage extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      admin_or_owner: false,
      task: null,
      rounds: null,
      owners: null,
      get_models_in_the_loop: null,
      model_identifiers: null,
      datasets: null,
      availableDatasetAccessTypes: null,
      availableDatasetLogAccessTypes: null,
      dataExporting: {},
    };
  }

  refreshData() {
    if (
      this.props.location.hash === "" ||
      this.props.location.hash === "#settings"
    ) {
      return this.fetchTask();
    } else if (this.props.location.hash === "#owners") {
      return this.fetchTask(() => this.fetchOwners());
    } else if (this.props.location.hash === "#rounds") {
      return this.fetchTask(() =>
        this.fetchRounds(() => this.fetchModelIdentifiersForTargetSelection())
      );
    } else if (this.props.location.hash === "#models") {
      return this.fetchTask(() => this.fetchModelIdentifiers());
    } else if (this.props.location.hash === "#datasets") {
      return this.fetchTask(() =>
        this.fetchDatasets(() =>
          this.fetchAvailableDatasetAccessTypes(() =>
            this.fetchAvailableDatasetLogAccessTypes()
          )
        )
      );
    }
  }

  componentDidMount() {
    if (!this.context.api.loggedIn()) {
      this.props.history.push(
        "/login?msg=" +
          encodeURIComponent("Please login first.") +
          "&src=/owner#profile"
      );
    } else {
      this.fetchTask(() => {
        if (!this.state.admin_or_owner) {
          this.props.history.push(
            "/login?msg=" +
              encodeURIComponent(
                "You are not an admin or owner of this task. Please login with an admin or owner account."
              ) +
              "&src=/owner#profile"
          );
        } else {
          this.refreshData();
        }
      });
    }
  }

  fetchTask = (callback = () => {}) => {
    return this.context.api.getTask(this.props.match.params.taskCode).then(
      (result) => {
        this.context.api.getAdminOrOwner(result.id).then(
          (adminOrOwnerResult) => {
            this.setState(
              {
                admin_or_owner: adminOrOwnerResult.admin_or_owner,
                task: result,
              },
              callback
            );
          },
          (error) => {
            console.log(error);
          }
        );
      },
      (error) => {
        console.log(error);
      }
    );
  };

  fetchOwners = (callback = () => {}) => {
    return this.context.api.getOwners(this.state.task.id).then(
      (result) => {
        this.setState({ owners: result }, callback);
      },
      (error) => {
        console.log(error);
      }
    );
  };

  fetchRounds = (callback = () => {}) => {
    return this.context.api.getRounds(this.state.task.id).then(
      (result) => {
        this.setState({ rounds: result }, callback);
      },
      (error) => {
        console.log(error);
      }
    );
  };

  fetchDatasets = (callback = () => {}) => {
    return this.context.api.getDatasets(this.state.task.id).then(
      (result) => {
        this.setState({ datasets: result }, callback);
      },
      (error) => {
        console.log(error);
      }
    );
  };

  fetchAvailableDatasetAccessTypes = (callback = () => {}) => {
    return this.context.api.getAvailableDatasetAccessTypes().then(
      (result) => {
        this.setState({ availableDatasetAccessTypes: result }, callback);
      },
      (error) => {
        console.log(error);
      }
    );
  };

  fetchAvailableDatasetLogAccessTypes = (callback = () => {}) => {
    return this.context.api.getAvailableDatasetLogAccessTypes().then(
      (result) => {
        this.setState({ availableDatasetLogAccessTypes: result }, callback);
      },
      (error) => {
        console.log(error);
      }
    );
  };

  fetchModelIdentifiers = (callback = () => {}) => {
    this.context.api.getModelIdentifiers(this.state.task.id).then(
      (result) => {
        this.setState({ model_identifiers: result }, callback);
      },
      (error) => {
        console.log(error);
      }
    );
  };

  exportData = (rid, callback = () => {}) => {
    var newDict = { ...this.state.dataExporting };
    newDict[rid] = true;
    this.setState({ dataExporting: newDict });

    return this.context.api.exportData(this.state.task.id, rid).then(
      (result) => {
        var newDict = { ...this.state.dataExporting };
        newDict[rid] = false;
        this.setState({ dataExporting: newDict }, callback);
      },
      (error) => {
        console.log(error);
        var newDict = { ...this.state.dataExporting };
        newDict[rid] = false;
        this.setState({ dataExporting: newDict });
      }
    );
  };

  fetchModelIdentifiersForTargetSelection = (callback = () => {}) => {
    this.context.api
      .getModelIdentifiersForTargetSelection(this.state.task.id)
      .then(
        (result) => {
          this.setState({ get_models_in_the_loop: result }, callback);
        },
        (error) => {
          console.log(error);
        }
      );
  };

  componentDidUpdate(prevProps) {
    if (prevProps.location.hash !== this.props.location.hash) {
      this.refreshData();
    }
  }

  handleContextsSubmit = (
    values,
    { setFieldError, setFieldValue, resetForm, setSubmitting }
  ) => {
    const data = {
      file: values.contexts_file,
    };

    return this.context.api
      .submitContexts(this.state.task.id, values.rid, data)
      .then(
        (result) => {
          values.contexts_file = null;
          resetForm({ values: values });
          setSubmitting(false);
        },
        (error) => {
          values.contexts_file = null;
          resetForm({ values: values });
          setFieldError(
            "accept",
            "File could not be submitted (" + error.error + ")"
          );
          setSubmitting(false);
          console.log(error);
        }
      );
  };

  handleTaskActivate = (
    values,
    { setFieldError, setSubmitting, resetForm }
  ) => {
    this.context.api.activateTask(this.state.task.id, values.config_yaml).then(
      (result) => {
        this.fetchTask(() => {
          resetForm({ values: values });
          setSubmitting(false);
        });
      },
      (error) => {
        console.log(error);
        setFieldError(
          "accept",
          "Task could not be activated (" + error.error + ")"
        );
        setSubmitting(false);
      }
    );
  };

  handleTaskUpdate = (values, { setFieldError, setSubmitting, resetForm }) => {
    const allowed = [
      "num_matching_validations",
      "unpublished_models_in_leaderboard",
      "validate_non_fooling",
      "instructions_md",
      "predictions_upload_instructions_md",
      "train_file_upload_instructions_md",
      "mlcube_tutorial_markdown",
      "dynamic_adversarial_data_collection",
      "dynamic_adversarial_data_validation",
      "hidden",
      "submitable",
      "create_endpoint",
      "build_sqs_queue",
      "eval_sqs_queue",
      "is_decen_task",
      "task_aws_account_id",
      "task_gateway_predict_prefix",
      "config_yaml",
      "context",
      "leaderboard_description",
    ];

    const data = Object.keys(values)
      .filter((key) => allowed.includes(key))
      .reduce((obj, key) => {
        obj[key] = values[key];
        return obj;
      }, {});

    this.context.api.updateTask(this.state.task.id, data).then(
      (result) => {
        this.fetchTask(() => {
          resetForm({ values: data });
          setSubmitting(false);
        });
      },
      (error) => {
        console.log(error);
        setFieldError(
          "accept",
          "Task could not be updated (" + error.error + ")"
        );
        setSubmitting(false);
      }
    );
  };

  handleOwnerUpdate = (values, { setFieldError, setSubmitting, resetForm }) => {
    this.context.api
      .toggleOwner(this.state.task.id, values.owner_to_toggle)
      .then(
        () => {
          this.fetchOwners(() => {
            resetForm({
              values: {
                owners: this.state.owners,
                owner_to_toggle: null,
              },
            });
            setSubmitting(false);
          });
        },
        (error) => {
          console.log(error);
          setFieldError(
            "accept",
            "Owners could not be updated (" + error.error + ")"
          );
          setSubmitting(false);
        }
      );
  };

  handleDatasetUpdate = (
    values,
    { setFieldError, setSubmitting, resetForm }
  ) => {
    const allowed = [
      "longdesc",
      "rid",
      "source_url",
      "access_type",
      "log_access_type",
    ];

    const data = Object.keys(values)
      .filter((key) => allowed.includes(key))
      .reduce((obj, key) => {
        obj[key] = values[key];
        return obj;
      }, {});

    this.context.api.updateDataset(values.id, data).then(
      (result) => {
        this.fetchDatasets(() => {
          resetForm({
            values: values,
          });
          setSubmitting(false);
        });
      },
      (error) => {
        console.log(error);
        setFieldError(
          "accept",
          "Dataset could not be updated (" + error.error + ")"
        );
        setSubmitting(false);
      }
    );
  };

  handleDatasetDelete = (did) => {
    this.context.api.deleteDataset(did).then((result) => {
      this.fetchDatasets();
    });
  };

  handleRoundUpdate = (
    values,
    { setFieldError, setSubmitting, setFieldValue, resetForm }
  ) => {
    const model_ids = [];

    for (const model_identifier of values.model_identifiers) {
      if (model_identifier.is_in_the_loop) {
        model_ids.push(model_identifier.model_id);
      }
    }

    const data = {
      model_ids: model_ids,
      longdesc: values.longdesc,
    };

    this.context.api
      .updateModelsInTheLoop(this.state.task.id, values.rid, data)
      .then(
        () => {
          if (values.contexts_file) {
            this.handleContextsSubmit(values, {
              setFieldError,
              setFieldValue,
              setSubmitting,
              resetForm,
            }).then(
              this.fetchRounds(() => {
                resetForm({
                  values: values,
                });
                setSubmitting(false);
              })
            );
          } else {
            this.fetchRounds(() => {
              resetForm({
                values: values,
              });
              setSubmitting(false);
            });
          }
        },
        (error) => {
          console.log(error);
          setFieldError(
            "accept",
            "Round could not be updated (" + error.error + ")"
          );
          setSubmitting(false);
        }
      );
  };

  createRound = () => {
    this.context.api.createRound(this.state.task.id).then(
      () => {
        this.refreshData();
      },
      (error) => {
        console.log(error);
      }
    );
  };

  handleUploadAndCreateDataset = (
    values,
    { setFieldError, setSubmitting, setFieldValue, resetForm }
  ) => {
    const files = { file: values.file };
    const config = yaml.load(this.state.task.config_yaml);
    const delta_metric_configs = config.delta_metrics
      ? config.delta_metrics
      : [];
    for (const config of delta_metric_configs) {
      files[config.type] = values[config.type];
    }
    this.context.api
      .uploadAndCreateDataset(this.state.task.id, values.name, files)
      .then(
        () => {
          this.refreshData();
          values.name = "";
          for (const fname of Object.keys(files)) {
            values[fname] = null;
          }
          resetForm({ values: values });
          setSubmitting(false);
        },
        (error) => {
          console.log(error);
          setFieldError(
            "accept",
            "Dataset could not be added (" + error.error + ")"
          );
          setSubmitting(false);
        }
      );
  };

  render() {
    const navOptions = [
      {
        href: "#settings",
        buttonText: "Settings",
      },
      {
        href: "#instructions",
        buttonText: "Instructions",
      },
      {
        href: "#advanced",
        buttonText: "Advanced",
      },
      {
        href: "#owners",
        buttonText: "Owners",
      },
      {
        href: "#rounds",
        buttonText: "Rounds",
      },
      {
        href: "#models",
        buttonText: "Models",
      },
      {
        href: "#datasets",
        buttonText: "Datasets",
      },
      {
        href: "#examples",
        buttonText: "Examples created",
      },
    ];

    return (
      <Container fluid>
        <Row>
          <Col lg={2} className="p-0 border col-span-2 min-h-screen">
            <Nav className="flex-lg-column sidebar-wrapper sticky-top">
              {navOptions.map((navOption) => (
                <Nav.Item key={navOption.href}>
                  <Nav.Link
                    href={navOption.href}
                    className={`gray-color p-4 px-lg-6 ${
                      this.props.location.hash === navOption.href
                        ? "active"
                        : ""
                    }`}
                  >
                    {navOption.buttonText}
                  </Nav.Link>
                </Nav.Item>
              ))}
            </Nav>
          </Col>
          <Col className="md:col-span-10">
            {this.props.location.hash === "#settings" && this.state.task ? (
              <Settings
                task={this.state.task}
                handleTaskUpdate={this.handleTaskUpdate}
              />
            ) : null}
            {this.props.location.hash === "#advanced" && this.state.task ? (
              <Advanced
                task={this.state.task}
                handleTaskActivate={this.handleTaskActivate}
                handleTaskUpdate={this.handleTaskUpdate}
              />
            ) : null}
            {this.state.task?.active ? (
              <>
                {this.props.location.hash === "#instructions" &&
                this.state.task ? (
                  <Instructions taskId={this.state.task.id} />
                ) : null}
                {this.props.location.hash === "#owners" && this.state.owners ? (
                  <Owners
                    owners={this.state.owners}
                    handleOwnerUpdate={this.handleOwnerUpdate}
                  />
                ) : null}
                {this.props.location.hash === "#rounds" &&
                this.state.rounds &&
                this.state.get_models_in_the_loop ? (
                  <Rounds
                    rounds={this.state.rounds}
                    task={this.state.task}
                    get_models_in_the_loop={this.state.get_models_in_the_loop}
                    createRound={this.createRound}
                    handleRoundUpdate={this.handleRoundUpdate}
                    exportData={this.exportData}
                    dataExporting={this.state.dataExporting}
                  />
                ) : null}
                {this.props.location.hash === "#models" &&
                this.state.model_identifiers ? (
                  <Models model_identifiers={this.state.model_identifiers} />
                ) : null}
                {this.props.location.hash === "#datasets" &&
                this.state.task &&
                this.state.datasets &&
                this.state.availableDatasetAccessTypes &&
                this.state.availableDatasetLogAccessTypes ? (
                  <Datasets
                    task={this.state.task}
                    datasets={this.state.datasets}
                    availableAccessTypes={
                      this.state.availableDatasetAccessTypes
                    }
                    availableLogAccessTypes={
                      this.state.availableDatasetLogAccessTypes
                    }
                    handleDatasetUpdate={this.handleDatasetUpdate}
                    handleUploadAndCreateDataset={
                      this.handleUploadAndCreateDataset
                    }
                    handleDatasetDelete={this.handleDatasetDelete}
                  />
                ) : null}
                {this.props.location.hash === "#examples" && this.state.task ? (
                  <ExamplesCreated
                    taskId={this.state.task.id}
                    s3Bucket={this.state.task.bucket_for_aditional_example_data}
                  />
                ) : null}
              </>
            ) : (
              this.props.location.hash !== "#settings" &&
              this.props.location.hash !== "#advanced" && (
                <Container className="pb-5 mb-5">
                  <Card className="my-4">
                    <Card.Body>
                      <Row className="justify-content-center">
                        Activate this task first.
                      </Row>
                    </Card.Body>
                  </Card>
                </Container>
              )
            )}
          </Col>
        </Row>
      </Container>
    );
  }
}

export default TaskOwnerPage;
