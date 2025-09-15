/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import {
  useEffect,
  useState,
  useContext,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Card,
  Pagination,
  Button,
  Tooltip,
  OverlayTrigger,
  Modal,
  Popover,
} from "react-bootstrap";
import useFetch from "use-http";
import { ScaleLoader } from "react-spinners";

import UserContext from "containers/UserContext";

import TaskModelLeaderboardTable from "new_front/components/Tables/Leaderboard/TaskModelLeaderboardTable";
import { SortDirection } from "components/TaskLeaderboard/SortContainer";
import {
  ForkModal,
  SnapshotModal,
} from "components/TaskLeaderboard/ForkAndSnapshotModalWrapper";
import DropdownSearch from "new_front/components/Inputs/DropdownSearch";
import Swal from "sweetalert2";
const yaml = require("js-yaml");

const TaskModelLeaderboardCard = ({
  title,
  task,
  history,
  taskCode,
  percentageFormat,
  disableForkAndSnapshot,
  disableToggleSort,
  disableAdjustWeights,
  disablePagination,
  modelColumnTitle,
  getInitialWeights,
}) => {
  const taskId = task.id;
  const config_yaml = yaml.load(task.config_yaml);
  const leaderboardFilter = config_yaml?.leaderboard?.filter || false;
  const lastCallArgs = useRef(null);
  const initialWeights = useRef(null);
  const [data, setData] = useState([]);
  const [enableHelp, setEnableHelp] = useState(false);
  const [enableWeights, setEnableWeights] = useState(false);
  const [enableDatasetWeights, setEnableDatasetWeights] = useState(false);
  const [metrics, setMetrics] = useState();
  const [datasetWeights, setDatasetWeights] = useState();
  const [sort, setSort] = useState({
    field: "dynascore",
    direction: SortDirection.DESC,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [showForkModal, setShowForkModal] = useState(false);
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [description, setDescription] = useState(null);
  const [multiplyResultsByHundred, setMultiplyResultsByHundred] =
    useState(false);
  const { post, loading, response } = useFetch();
  const context = useContext(UserContext);
  const [leaderboardOptions, setLeaderboardOptions] = useState([
    { back_label: null, value: "Summary" },
  ]);
  const [filterSelected, setFilterSelected] = useState({
    back_label: null,
    value: "Summary",
  });

  useEffect(() => {
    setPage(0);
  }, [taskId]);

  const setMetricWeight = useCallback((metricID, newWeight) => {
    setMetrics((state) => {
      const list = state.map((item, j) => {
        if (item.id === metricID) {
          return { ...item, weight: newWeight };
        } else {
          return item;
        }
      });
      return list;
    });
  }, []);

  const setDatasetWeight = useCallback((datasetID, newWeight) => {
    setDatasetWeights((state) => {
      const list = state.map((item, j) => {
        if (item.id === datasetID) {
          return { ...item, weight: newWeight };
        } else {
          return item;
        }
      });
      return list;
    });
  }, []);

  const toggleSort = useCallback(
    (field) => {
      if (disableToggleSort) {
        return;
      }

      setSort((currentSort) => {
        const currentDirection = currentSort.direction;
        const newDirection =
          field !== sort.field
            ? SortDirection.DESC
            : SortDirection.getOppositeDirection(currentDirection);

        return {
          field: field,
          direction: newDirection,
        };
      });
    },
    [disableToggleSort]
  );

  const handleFilterChange = async (newFilter) => {
    setFilterSelected(newFilter);
    const { datasetWeightsList, metricWeightsList, metricsIDs } =
      await weightCalculations;
    handleScoreData(
      datasetWeightsList,
      metricWeightsList,
      metricsIDs,
      newFilter.back_label
    );
  };

  useEffect(() => {
    setIsLoading(true);
    const currentArgs = JSON.stringify({
      task,
      context,
      sort,
      page,
    });

    if (initialWeights.current === currentArgs) {
      return;
    }
    initialWeights.current = currentArgs;
    try {
      getInitialWeights(task, context.api, (result) => {
        if (
          result.orderedMetricWeights?.length &&
          result.orderedDatasetWeights?.length
        ) {
          setMetrics(result.orderedMetricWeights);
          setDatasetWeights(result.orderedDatasetWeights);
          setDescription(result.description);
        } else {
          console.error("Invalid initial weights format:", result);
        }
      });
    } catch (error) {
      console.error("Error fetching initial weights:", error);
    } finally {
      setIsLoading(false);
    }
  }, [context.api, task, getInitialWeights]);

  const weightCalculations = useMemo(() => {
    if (!datasetWeights?.length || !metrics?.length) {
      return null;
    }
    const datasetWeightsList = datasetWeights.map(
      (obj) =>
        obj.weight / datasetWeights.reduce((sum, item) => sum + item.weight, 0)
    );

    const metricWeightsList = metrics.map(
      (obj) => obj.weight / metrics.reduce((sum, item) => sum + item.weight, 0)
    );

    return {
      datasetWeightsList,
      metricWeightsList,
      metricsIDs: metrics.map((metric) => metric.id),
    };
  }, [datasetWeights, metrics]);

  const handleScoreData = useCallback(
    async (datasetWeightsList, metricWeightsList, metricIds, filter = null) => {
      setIsLoading(true);
      try {
        const params = {
          task_id: taskId,
          ordered_metric_weights: metricWeightsList,
          ordered_scoring_dataset_weights: datasetWeightsList,
          sort_by: sort?.field,
          sort_direction: sort?.direction,
          offset: page * pageLimit,
          limit: pageLimit,
          metrics: metricIds,
        };
        if (filter) {
          params.filtered = filter;
        }
        const scoreData = await post(
          "/task/get_dynaboard_info_by_task_id/",
          params
        );
        if (!response.ok) {
          throw new Error(
            `API Error: ${response.status} - ${
              scoreData?.message || "Unknown error"
            }`
          );
        }
        setData(scoreData.data);
        setTotal(scoreData.count);
      } catch (error) {
        console.log("Error fetching score data:", error);
        if (filter) {
          Swal.fire({
            title: "No data",
            text: "There is no data for the selected filter, try a new value",
            icon: "error",
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      taskId,
      post,
      sort?.field,
      sort?.direction,
      page,
      pageLimit,
      response,
      filterSelected,
    ]
  );

  useEffect(() => {
    if (!weightCalculations) {
      //Weight calculations are not ready yet
      return;
    }
    const { datasetWeightsList, metricWeightsList, metricsIDs } =
      weightCalculations;

    const currentArgs = JSON.stringify({
      datasetWeightsList,
      metricWeightsList,
      metricsIDs,
      sort,
      page,
    });

    if (lastCallArgs.current === currentArgs) {
      return;
    }

    lastCallArgs.current = currentArgs;

    handleScoreData(datasetWeightsList, metricWeightsList, metricsIDs);
  }, [weightCalculations, handleScoreData]);

  useEffect(() => {
    leaderboardFilter &&
      leaderboardOptions.length === 1 &&
      setLeaderboardOptions((prevOptions) => [
        ...prevOptions,
        ...(config_yaml.leaderboard?.options || []),
      ]);
  }, []);

  const isEndOfPage = (page + 1) * pageLimit >= total;

  return (
    <Card className="my-4">
      <Card.Header className="light-gray-bg d-flex align-items-center">
        <h2 className="m-0 text-uppercase text-reset">
          {title || "Model Leaderboard"}
        </h2>
        {description && description.length !== 0 && (
          <OverlayTrigger
            placement={"right"}
            delay={{ show: 250, hide: 400 }}
            overlay={
              <Popover>
                {<Popover.Content>{description}</Popover.Content>}
              </Popover>
            }
          >
            <div className="d-inline-block">
              <i
                style={{ lineHeight: "inherit" }}
                className="ml-1 align-middle fa fa-info-circle"
                aria-hidden="true"
              />
            </div>
          </OverlayTrigger>
        )}
        <div className="d-flex justify-content-end flex-fill">
          {percentageFormat && (
            <>
              <span className="mt-1 mr-2">
                <small>Percentage</small>
              </span>
              <input
                type="checkbox"
                checked={multiplyResultsByHundred}
                onChange={() =>
                  setMultiplyResultsByHundred(!multiplyResultsByHundred)
                }
              />
            </>
          )}
          {leaderboardFilter && (
            <div className="dropdown-search-container mr-3 w-72">
              <DropdownSearch
                options={leaderboardOptions}
                value={filterSelected.value}
                onChange={handleFilterChange}
              />
            </div>
          )}
          <ForkModal
            metricWeights={metrics}
            datasetWeights={datasetWeights}
            taskId={taskId}
            taskCode={taskCode}
            showModal={showForkModal}
            setShowModal={setShowForkModal}
            history={history}
          />
          <SnapshotModal
            metricWeights={metrics}
            datasetWeights={datasetWeights}
            taskId={taskId}
            taskCode={taskCode}
            showModal={showSnapshotModal}
            setShowModal={setShowSnapshotModal}
            history={history}
            sort={sort}
            total={total}
          />
          <Modal
            size="lg"
            show={enableHelp}
            onHide={() => setEnableHelp(!enableHelp)}
          >
            <Modal.Header closeButton>
              <Modal.Title>Dynaboard Information</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              This is a{" "}
              <b>
                <a href={"https://arxiv.org/abs/2106.06052"}>
                  dynamic leaderboard
                </a>
              </b>
              . It allows you, the user, to specify your own utility function
              over a variety of metrics and datasets, which determines the final
              ranking of models for this particular task. The default initial
              weights are specified by the task owners.
              <br />
              <br />
              There are a few important caveats that you should keep in mind
              when interacting with this leaderboard:
              <br />
              <br />
              <ul>
                <li>
                  The dynascore is dynamic. It is computed with respect to other
                  models in the system, and thus keeps changing over time. We do
                  not recommend reporting solely on the dynascore in papers,
                  unless it is clearly accompanied with a reference to the
                  dynamic leaderboard.
                </li>
                <li>
                  The fairness and robustness metrics are far from perfect.
                  There is no singular way to measure model fairness. Whether to
                  include any explicit fairness metric was a difficult choice –
                  we acknowledge that we might inadvertently facilitate false or
                  spurious fairness claims, fairness-value hacking, or give
                  people a false sense of fairness. The research community has a
                  long way to go in terms of developing well-defined concrete
                  fairness measurements. Ultimately, however, we came to the
                  conclusion that fairness is such an important axis of
                  evaluation that we would rather have an imperfect metric than
                  no metric at all: in our view, a multi-metric model evaluation
                  framework simply must include fairness as a primary evaluation
                  axis. Please refer to the paper for more details. We encourage
                  the community to come up with better blackbox fairness and
                  robustness metrics.
                </li>
                <li>
                  The compute and memory metrics are computed using AWS
                  Cloudwatch. Throughput in examples per second is computed as
                  the total number of examples divided by the inference time in
                  seconds. The inference time is the difference between
                  TransformEndTime and TransformStartTime from AWS’s{" "}
                  <a
                    href={
                      "https://docs.aws.amazon.com/sagemaker/latest/APIReference/API_DescribeTransformJob.html"
                    }
                  >
                    DescribeTransformJob API
                  </a>
                  . Memory is the average of all logged{" "}
                  <a
                    href={
                      "https://docs.aws.amazon.com/sagemaker/latest/dg/monitoring-cloudwatch.html#cloudwatch-metrics-jobs"
                    }
                  >
                    MemoryUtilization
                  </a>{" "}
                  data points (logged as a utilization percentage every 1 minute
                  by AWS) during inference, which is converted into GiB by
                  multiplying with the total available memory of the instance
                  type. Note that this is the memory utilization of the entire
                  model’s docker container that serves the model. Both metrics
                  are dependent on the instance type, and contain some
                  randomness, i.e. they are expected to change slightly every
                  time even in exactly the same setup. In our setup,{" "}
                  <a href={"https://aws.amazon.com/sagemaker/pricing/"}>
                    ml.m5.2xlarge
                  </a>{" "}
                  is the default machine instance, which has 8 cpus and 32 GiB
                  memory. All metrics are higher-is-better, except memory, where
                  lower is better.
                </li>
              </ul>
              For more details, see the paper.
            </Modal.Body>
          </Modal>
          {(process.env.REACT_APP_ENABLE_LEADERBOARD_SNAPSHOT === "true" ||
            context.user.admin) &&
            !disableForkAndSnapshot && (
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip id="tip-leaderboard-fork">Snapshot</Tooltip>}
              >
                <Button
                  className="bg-transparent border-0 btn"
                  onClick={() => {
                    if (context.api.loggedIn()) {
                      setShowSnapshotModal(true);
                    } else {
                      history.push(
                        "/login?msg=" +
                          encodeURIComponent(
                            "You need to login to create a leaderboard snapshot."
                          ) +
                          `&src=/tasks/${taskCode}`
                      );
                    }
                  }}
                >
                  <span className="text-black-50">
                    <i className="fas fa-camera"></i>
                  </span>
                </Button>
              </OverlayTrigger>
            )}
          {(process.env.REACT_APP_ENABLE_LEADERBOARD_FORK === "true" ||
            context.user.admin) &&
            !disableForkAndSnapshot && (
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip id="tip-leaderboard-fork">Fork</Tooltip>}
              >
                <Button
                  className="bg-transparent border-0 btn"
                  onClick={() => {
                    if (context.api.loggedIn()) {
                      setShowForkModal(true);
                    } else {
                      history.push(
                        "/login?msg=" +
                          encodeURIComponent(
                            "You need to login to fork a leaderboard."
                          ) +
                          `&src=/tasks/${taskCode}`
                      );
                    }
                  }}
                >
                  <span className="text-black-50">
                    <i className="fas fa-code-branch"></i>
                  </span>
                </Button>
              </OverlayTrigger>
            )}
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip id="tip-metric-weights">Help</Tooltip>}
          >
            <Button
              className="bg-transparent border-0 btn"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setEnableHelp(!enableHelp);
              }}
            >
              <span className="text-black-50">
                <i className="fas fa-question"></i>
              </span>
            </Button>
          </OverlayTrigger>
          {!disableAdjustWeights && (
            <>
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="tip-metric-weights">Metric Weights</Tooltip>
                }
              >
                <Button
                  className="bg-transparent border-0 btn"
                  onClick={() => {
                    setEnableWeights(!enableWeights);
                    setEnableDatasetWeights(false);
                  }}
                >
                  <span className="text-black-50">
                    <i className="fas fa-sliders-h"></i>
                  </span>
                </Button>
              </OverlayTrigger>
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="tip-dataset-weights">Dataset Weights</Tooltip>
                }
              >
                <Button
                  className="bg-transparent border-0 btn"
                  onClick={() => {
                    setEnableDatasetWeights(!enableDatasetWeights);
                    setEnableWeights(false);
                  }}
                >
                  <span className="text-black-50">
                    <i className="fas fa-database"></i>
                  </span>
                </Button>
              </OverlayTrigger>
            </>
          )}
        </div>
      </Card.Header>
      {loading ? (
        <div className="grid justify-items-center">
          <div>
            <ScaleLoader
              color="#ccebd4"
              loading={loading}
              size={50}
              className="align-center"
            />
          </div>
        </div>
      ) : (
        <Card.Body className="p-0 leaderboard-container">
          {!loading && data.length !== 0 && (
            <TaskModelLeaderboardTable
              data={data}
              enableWeights={enableWeights}
              metrics={metrics}
              setMetricWeight={setMetricWeight}
              enableDatasetWeights={enableDatasetWeights}
              datasetWeights={datasetWeights}
              setDatasetWeight={setDatasetWeight}
              sort={sort}
              toggleSort={toggleSort}
              modelColumnTitle={modelColumnTitle}
              showUserNames={task.show_username_leaderboard}
              multiplyResultsByHundred={multiplyResultsByHundred}
            />
          )}
        </Card.Body>
      )}
      <Card.Footer className="text-center">
        <Pagination className="float-right mb-0" size="sm">
          {disablePagination ? (
            <img
              src="/Powered_by_Dynabench-Logo.svg"
              style={{ height: "24px" }}
              alt="dynabench logo"
            />
          ) : (
            <>
              <Pagination.Item
                disabled={isLoading || page === 0}
                onClick={() => {
                  setPage(page - 1);
                }}
              >
                Previous
              </Pagination.Item>
              <Pagination.Item
                disabled={isLoading || isEndOfPage}
                onClick={() => {
                  setPage(page + 1);
                }}
              >
                Next
              </Pagination.Item>
            </>
          )}
        </Pagination>
      </Card.Footer>
    </Card>
  );
};
export default TaskModelLeaderboardCard;
