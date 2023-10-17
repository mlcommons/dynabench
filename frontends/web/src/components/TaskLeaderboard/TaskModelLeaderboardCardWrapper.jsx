/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from "react";
import TaskModelLeaderboardCard from "new_front/components/Tables/Leaderboard/TaskModelLeaderboardCard";
import { useParams } from "react-router-dom";

const taskModelLeaderboardCardWrapper = (
  getInitialWeights,
  fetchLeaderboardData
) => {
  return (props) => {
    const { forkOrSnapshotName } = useParams();
    const dataFromProps = {
      leaderboardName: forkOrSnapshotName,
      history: props.history,
      snapshotData: props.snapshotData,
    };
    return (
      <TaskModelLeaderboardCard
        title={props.title}
        task={props.task}
        history={props.history}
        taskCode={props.taskCode}
        decimalFormat={props.decimalFormat}
        disableForkAndSnapshot={props.disableForkAndSnapshot}
        disableToggleSort={props.disableToggleSort}
        disableAdjustWeights={props.disableAdjustWeights}
        disablePagination={props.disablePagination}
        modelColumnTitle={props.modelColumnTitle}
        getInitialWeights={(...args) =>
          getInitialWeights(...args, dataFromProps)
        }
        fetchLeaderboardData={(...args) =>
          fetchLeaderboardData(...args, dataFromProps)
        }
      />
    );
  };
};

const loadDefaultWeights = (metricIdToDataObj, datasetIdToDataObj, task) => {
  task.ordered_metrics.forEach((m) => {
    metricIdToDataObj[m.name] = {
      id: m.name,
      label: m.name,
      weight: m.default_weight,
      unit: m.unit,
    };
  });

  task.ordered_scoring_datasets.forEach((ds) => {
    datasetIdToDataObj[ds.id] = {
      id: ds.id,
      weight: ds.default_weight,
      name: ds.name,
    };
  });
};

export const getOrderedWeights = (metricWeights, datasetWeights) => {
  const metricSum = metricWeights?.reduce(
    (acc, entry) => acc + entry.weight,
    0
  );
  const orderedMetricWeights = metricWeights?.map((entry) =>
    metricSum === 0 ? 0.0 : entry.weight / metricSum
  );
  const dataSetSum = datasetWeights?.reduce(
    (acc, entry) => acc + entry.weight,
    0
  );
  const orderedDatasetWeights = datasetWeights?.map((entry) =>
    dataSetSum === 0 ? 0.0 : entry.weight / dataSetSum
  );

  return { orderedMetricWeights, orderedDatasetWeights };
};

const loadDefaultData = (
  api,
  taskId,
  pageLimit,
  page,
  sort,
  metrics,
  datasetWeights,
  updateResultCallback
) => {
  const { orderedMetricWeights, orderedDatasetWeights } = getOrderedWeights(
    metrics,
    datasetWeights
  );

  if (
    orderedMetricWeights &&
    orderedDatasetWeights &&
    orderedMetricWeights.length > 0 &&
    orderedDatasetWeights.length > 0
  ) {
    api
      .getDynaboardScores(
        taskId,
        pageLimit,
        page * pageLimit,
        sort.field,
        sort.direction,
        orderedMetricWeights,
        orderedDatasetWeights
      )
      .then(
        (result) => {
          console.log(result);
          updateResultCallback(result);
        },
        (error) => {
          console.log(error);
          updateResultCallback(null);
        }
      );
  }
};

const getOrderedWeightObjects = (
  metricIdToDataObj,
  datasetIdToDataObj,
  task
) => {
  const orderedMetricWeights = task.ordered_metrics.map(
    (m) => metricIdToDataObj[m.name]
  );
  const orderedDatasetWeights = task.ordered_scoring_datasets.map(
    (ds) => datasetIdToDataObj[ds.id]
  );
  return { orderedMetricWeights, orderedDatasetWeights };
};

export const TaskModelDefaultLeaderboard = taskModelLeaderboardCardWrapper(
  (task, api, setWeightsCallback) => {
    const metricIdToDataObj = {};
    const datasetIdToDataObj = {};
    loadDefaultWeights(metricIdToDataObj, datasetIdToDataObj, task);
    setWeightsCallback(
      getOrderedWeightObjects(metricIdToDataObj, datasetIdToDataObj, task)
    );
  },
  loadDefaultData
);

export const TaskModelForkLeaderboard = taskModelLeaderboardCardWrapper(
  (task, api, setWeightsCallback, dataFromProps) => {
    const metricIdToDataObj = {};
    const datasetIdToDataObj = {};

    /* We first load the default weights for metrics and datasets. This is useful to load the default weight for
     * a metric/dataset which was added after the creation of a fork.
     */
    loadDefaultWeights(metricIdToDataObj, datasetIdToDataObj, task);

    const { leaderboardName, history } = dataFromProps;

    /* Through this API, the default weights for metrics and datasets get overwritten by the weights saved during
     * creation of the fork.
     */
    api.getLeaderboardConfiguration(task.id, leaderboardName).then(
      (result) => {
        const configuration_json = JSON.parse(result.configuration_json);
        configuration_json.metricWeights.forEach((m) => {
          if (m.id in metricIdToDataObj) {
            metricIdToDataObj[m.id].weight = m.weight;
          }
        });
        configuration_json.datasetWeights.forEach((d) => {
          if (d.id in datasetIdToDataObj) {
            datasetIdToDataObj[d.id].weight = d.weight;
          }
        });
        setWeightsCallback({
          ...getOrderedWeightObjects(
            metricIdToDataObj,
            datasetIdToDataObj,
            task
          ),
          description: result.desc,
        });
      },
      (error) => {
        console.log(error);
        if (error && error.status_code === 404) {
          history.replace({
            pathname: `/tasks/${task.task_code}`,
          });
        }
        setWeightsCallback(
          getOrderedWeightObjects(metricIdToDataObj, datasetIdToDataObj, task)
        );
      }
    );
  },
  loadDefaultData
);

export const TaskModelSnapshotLeaderboard = taskModelLeaderboardCardWrapper(
  (task, api, setWeightsCallback, dataFromProps) => {
    const { snapshotData } = dataFromProps;
    const { metricWeights, datasetWeights } = snapshotData;
    setWeightsCallback({
      orderedMetricWeights: metricWeights,
      orderedDatasetWeights: datasetWeights,
    });
  },
  (
    api,
    taskId,
    pageLimit,
    page,
    sort,
    metrics,
    datasetWeights,
    updateResultCallback,
    dataFromProps
  ) => {
    const { snapshotData } = dataFromProps;
    updateResultCallback({
      data: snapshotData.data.slice(page * pageLimit, (page + 1) * pageLimit),
      count: snapshotData.count,
      sort: snapshotData.miscInfoJson.sort,
    });
  }
);
