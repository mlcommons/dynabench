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

import {
  Form,
  OverlayTrigger,
  Popover,
  Container,
  Row,
  Col,
} from "react-bootstrap";
import React from "react";
import { useState, useRef } from "react";
import { Table } from "react-bootstrap";
import { Link } from "react-router-dom";
import WeightIndicator from "./WeightIndicator";
import ChevronExpandButton from "../Buttons/ChevronExpandButton";
import { SortContainer } from "./SortContainer";

/**
 * Weight Slider UI
 *
 * @param {number} weight current weight
 * @param {(number => void)} onWeightChange weight change handler
 */
const WeightSlider = ({ weight, onWeightChange }) => {
  return (
    <Form className="d-flex ml-2 float-right">
      <Form.Control
        type="range"
        className="flex-grow-1"
        size="sm"
        min={0}
        max={5}
        value={weight}
        onInput={(event) => {
          onWeightChange(event.target.valueAsNumber);
        }}
      />
    </Form>
  );
};

/**
 * Popover to show variance for a score component (target)
 *
 * @param {Object} props React params de-structured.
 * @param {string} props.variance the variance value to display in the popover
 * @param {React.ReactNode} props.children the Score Node that triggers the popover
 * @param {string} props.placement placement of the popover
 */
const VariancePopover = ({ variance, children, placement = "right" }) => {
  const target = useRef(null);
  // TODO: remove true when we have variances to show.
  if (null === variance || undefined === variance || true) {
    return children;
  }

  return (
    <OverlayTrigger
      placement={placement}
      delay={{ show: 250, hide: 400 }}
      overlay={
        <Popover>
          <Popover.Content>
            <div style={{ display: "inline" }}>
              <span className="position-absolute  mt-1">&minus;</span>
              <span>+</span>
            </div>
            {variance}
          </Popover.Content>
        </Popover>
      }
      target={target.current}
    >
      {children}
    </OverlayTrigger>
  );
};

/**
 * Popover to show Weight
 *
 * @param {Object} params React params de-structured.
 * @param {string} weight the weight value to display in the popover
 * @param {React.ReactNode} children the Node that triggers the popover
 */
const WeightPopover = ({ label, weight, children }) => {
  const target = useRef(null);

  if (null === weight || undefined === weight) {
    return children;
  }

  return (
    <OverlayTrigger
      placement="right"
      delay={{ show: 250, hide: 400 }}
      overlay={
        <Popover>
          <Popover.Content>
            {label} weight: {weight}
          </Popover.Content>
        </Popover>
      }
      target={target.current}
    >
      {children}
    </OverlayTrigger>
  );
};

const WarningPopover = ({ warning, direction, children }) => {
  const target = useRef(null);

  return (
    <OverlayTrigger
      placement={direction}
      delay={{ show: 250, hide: 400 }}
      overlay={
        <Popover>
          <Popover.Content>{warning}</Popover.Content>
        </Popover>
      }
      target={target.current}
    >
      {children}
    </OverlayTrigger>
  );
};

/**
 * Render a table row for a Model's scores.
 * This component also manages the expansion state of the row.
 *
 * @param {*} model The model data
 * @param {*} metrics Metrics metadata use for labels and weights.
 * @param {*} datasetWeights Datasets metadata use for labels and weights.
 *
 */
const TaskModelLeaderboardRow = ({ model, metrics, datasetWeights }) => {
  const [expanded, setExpanded] = useState(false);

  const dynascore = parseFloat(model.dynascore).toFixed(2);

  const totalRows = expanded ? model.datasets.length + 1 : 1;

  const weightsLookup = datasetWeights.reduce((acc, entry) => {
    acc[entry.id] = entry.weight;
    return acc;
  }, {});
  return (
    <>
      <tr
        key={model.model_id}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setExpanded(!expanded);
        }}
      >
        <td>
          {model.model_name ? (
            <Link to={`/models/${model.model_id}`} className="btn-link">
              {model.model_name}
            </Link>
          ) : (
            "Unpublished Model " + model.model_id
          )}{" "}
          {model.model_name &&
            (!model.uid ? (
              "anonymous"
            ) : (
              <Link to={`/users/${model.uid}#profile`} className="btn-link">
                ({model.username})
              </Link>
            ))}
          <div style={{ float: "right" }}>
            <ChevronExpandButton
              expanded={expanded}
              containerClassName={"position-absolute start-100"}
            />
          </div>
        </td>

        {model &&
          model.averaged_scores?.map((score, i) => {
            const variance =
              model.averaged_variances.length > i
                ? model.averaged_variances[i]
                : null;
            return (
              <td
                className="text-right t-2"
                key={`score-${model.model_name}-${metrics[i].id}-overall`}
              >
                <VariancePopover variance={parseFloat(variance).toFixed(2)}>
                  <span>
                    {expanded ? (
                      <b>{parseFloat(score).toFixed(2)}</b>
                    ) : (
                      parseFloat(score).toFixed(2)
                    )}
                  </span>
                </VariancePopover>
              </td>
            );
          })}

        <td className="text-right  align-middle pr-4 " rowSpan={totalRows}>
          <VariancePopover
            variance={parseFloat(model.dynavariance).toFixed(2)}
            placement="top"
          >
            <span>{expanded ? <h1>{dynascore}</h1> : dynascore}</span>
          </VariancePopover>
        </td>
      </tr>
      {expanded &&
        model.datasets &&
        model.datasets.map((dataset) => {
          const weight = weightsLookup[dataset.id];
          return (
            <tr key={`score-${dataset.name}`}>
              <td className="text-right pr-4  text-nowrap">
                <div className="d-flex justify-content-end align-items-center">
                  <WeightPopover label={dataset.name} weight={weight}>
                    <span className="d-flex align-items-center">
                      {dataset.name}&nbsp;
                      <WeightIndicator weight={weight} />
                    </span>
                  </WeightPopover>
                </div>
              </td>
              {dataset.scores &&
                dataset.scores.map((score, i) => {
                  return (
                    <td
                      className="text-right "
                      key={`score-${model.model_name}-${dataset.id}-${i}-overall`}
                    >
                      <VariancePopover
                        variance={parseFloat(dataset.variances[i]).toFixed(2)}
                      >
                        <span>{parseFloat(score).toFixed(2)}</span>
                      </VariancePopover>
                    </td>
                  );
                })}
            </tr>
          );
        })}
    </>
  );
};

/**
 * Header component for a metric. Includes sort, title, weight and unit for each metric.
 *
 * @param {Object} props.metric the metric for this instance.
 * @param {number} props.colWidth the proportional width for this column.
 *
 */
const MetricWeightTableHeader = ({
  metric,
  colWidth,
  setMetricWeight,
  enableWeights,
  sort,
  toggleSort,
}) => {
  return (
    <th
      className="text-right align-baseline "
      key={`th-${metric.id}`}
      style={{ width: `${colWidth}%` }}
    >
      <SortContainer
        sortKey={metric.id}
        toggleSort={toggleSort}
        currentSort={sort}
        className="d-flex justify-content-end align-items-center"
      >
        {metric.label === "Fairness" ? (
          <WarningPopover
            direction="right"
            warning={
              "Warning: this fairness metric is still under development. A high fairness score does not necessarily mean the model is fair along all dimensions or for all definitions of fairness. See the paper for details on this metric."
            }
          >
            <i
              style={{ color: "red", fontSize: 10 }}
              className="fas fa-exclamation"
            >
              &nbsp;
            </i>
          </WarningPopover>
        ) : (
          ""
        )}
        {metric.label === "Robustness" ? (
          <WarningPopover
            direction="right"
            warning={
              "Warning: this robustness metric is still under development. A high robustness score does not necessarily mean the model is robust along all dimensions or for all definitions of robustness. See the paper for details on this metric."
            }
          >
            <i
              style={{ color: "red", fontSize: 10 }}
              className="fas fa-exclamation"
            >
              &nbsp;
            </i>
          </WarningPopover>
        ) : (
          ""
        )}
        <WeightPopover label={metric.label} weight={metric.weight}>
          <span>
            {metric.label}&nbsp;
            <WeightIndicator weight={metric.weight} />
          </span>
        </WeightPopover>
      </SortContainer>

      {!enableWeights && (
        <>
          <span className="font-weight-light small">{metric.unit}</span>
        </>
      )}
      {enableWeights && (
        <WeightSlider
          weight={metric.weight}
          onWeightChange={(newWeight) => setMetricWeight(metric.id, newWeight)}
        />
      )}
    </th>
  );
};

/**
 * The Overall Model Leader board component
 *
 * @param {Array} props.models the models to show
 */
const TaskModelLeaderboardTable = ({
  models,
  enableWeights,
  metrics,
  setMetricWeight,
  enableDatasetWeights,
  datasetWeights,
  setDatasetWeight,
  sort,
  toggleSort,
  modelColumnTitle,
}) => {
  const total = metrics?.reduce((sum, metric) => sum + metric.weight, 0);
  const metricColumnWidth =
    60 / ((metrics?.length ?? 0) === 0 ? 1 : metrics.length);

  return (
    <Table hover className="mb-0">
      <thead>
        <tr>
          {!enableWeights && (
            <th className="align-baseline" style={{ width: "25%" }}>
              <SortContainer
                sortKey={"model"}
                toggleSort={toggleSort}
                currentSort={sort}
              >
                {modelColumnTitle ? modelColumnTitle : "Model"}
              </SortContainer>
            </th>
          )}
          {enableWeights && <th className="align-top">Metric Weights</th>}

          {metrics?.map((metric) => {
            return (
              <MetricWeightTableHeader
                metric={metric}
                colWidth={metricColumnWidth}
                setMetricWeight={setMetricWeight}
                enableWeights={enableWeights}
                total={total}
                sort={sort}
                toggleSort={toggleSort}
                key={`th-metric-${metric.id}`}
              />
            );
          })}
          <th
            className="text-right pr-4 align-baseline "
            style={{ width: "15%" }}
          >
            <SortContainer
              sortKey={"dynascore"}
              toggleSort={toggleSort}
              currentSort={sort}
            >
              <WarningPopover
                direction="left"
                warning={
                  "Warning, this score is dynamic and will change over time."
                }
              >
                <i
                  style={{ color: "red", fontSize: 10 }}
                  className="fas fa-exclamation"
                >
                  &nbsp;
                </i>
              </WarningPopover>
              Dynascore
            </SortContainer>
          </th>
        </tr>
        {enableDatasetWeights && (
          <>
            <tr>
              <th className="align-top">Dataset Weights</th>
              <th colSpan={metrics.length}>
                <Container fluid className="px-0">
                  <Row>
                    {datasetWeights?.map((dataset) => {
                      return (
                        <Col xs={12} sm={6} md={3}>
                          <WeightPopover
                            label={dataset.name}
                            weight={dataset.weight}
                          >
                            <span className="d-flex align-items-center justify-content-end">
                              {dataset.name}&nbsp;
                              <WeightIndicator weight={dataset.weight} />
                            </span>
                          </WeightPopover>
                          <div>
                            <WeightSlider
                              weight={dataset.weight}
                              onWeightChange={(newWeight) => {
                                setDatasetWeight(dataset.id, newWeight);
                              }}
                            />
                          </div>
                        </Col>
                      );
                    })}
                  </Row>
                </Container>
              </th>
              <th />
            </tr>
          </>
        )}
      </thead>
      <tbody>
        {models?.map((model) => (
          <TaskModelLeaderboardRow
            model={model}
            metrics={metrics}
            key={`model-${model.model_id}`}
            datasetWeights={datasetWeights}
          />
        ))}
      </tbody>
    </Table>
  );
};

export default TaskModelLeaderboardTable;
