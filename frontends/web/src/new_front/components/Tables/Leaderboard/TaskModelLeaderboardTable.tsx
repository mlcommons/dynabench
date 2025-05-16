import React, { FC, useRef, memo } from "react";
import {
  Col,
  Container,
  Form,
  OverlayTrigger,
  Popover,
  Row,
  Table,
} from "react-bootstrap";
import TaskModelLeaderboardRow from "new_front/components/Tables/Leaderboard/TaskModelLeaderboardRow";

type SortContainerProps = {
  sortKey: any;
  toggleSort: any;
  currentSort: any;
  className: any;
  children: any;
};

const SortContainer: FC<SortContainerProps> = ({
  sortKey,
  toggleSort,
  currentSort,
  className,
  children,
}) => {
  return (
    <div onClick={() => toggleSort(sortKey)} className={className}>
      {currentSort.field === sortKey && currentSort.direction === "asc" && (
        <i className="fas fa-sort-up">&nbsp;</i>
      )}
      {currentSort.field === sortKey && currentSort.direction === "desc" && (
        <i className="fas fa-sort-down">&nbsp;</i>
      )}
      {children}
    </div>
  );
};

type WeightPopoverProps = {
  label: any;
  weight: any;
  children: any;
};

const WeightPopover: FC<WeightPopoverProps> = ({ label, weight, children }) => {
  const target = useRef();

  if (null === weight || undefined === weight) {
    return children;
  }

  return (
    <OverlayTrigger
      placement="right"
      delay={{ show: 250, hide: 400 }}
      overlay={
        <Popover id="weight-popover">
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

type WarningPopoverProps = {
  warning: any;
  direction: any;
  children: any;
};

const WarningPopover: FC<WarningPopoverProps> = ({
  warning,
  direction,
  children,
}) => {
  const target = useRef();

  return (
    <OverlayTrigger
      placement={direction}
      delay={{ show: 250, hide: 400 }}
      overlay={
        <Popover id="warning-popover">
          <Popover.Content>{warning}</Popover.Content>
        </Popover>
      }
      target={target.current}
    >
      {children}
    </OverlayTrigger>
  );
};

type MetricWeightTableHeaderProps = {
  metric: any;
  colWidth: any;
  setMetricWeight: any;
  enableWeights: any;
  sort: any;
  toggleSort: any;
};

const MetricWeightTableHeader: FC<MetricWeightTableHeaderProps> = memo(
  ({ metric, colWidth, setMetricWeight, enableWeights, sort, toggleSort }) => {
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
              <svg width={10} height={12}>
                {[...Array(metric.weight)].map((x, i) => (
                  <rect
                    key={"" + i}
                    width="10"
                    height="1"
                    x={0}
                    y={10 - i * 2}
                    className="weight-indicator"
                  />
                ))}
              </svg>
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
            onWeightChange={(newWeight: any) =>
              setMetricWeight(metric.id, newWeight)
            }
          />
        )}
      </th>
    );
  },
);

type WeightSliderProps = {
  weight: any;
  onWeightChange: any;
};

const WeightSlider: FC<WeightSliderProps> = ({ weight, onWeightChange }) => {
  return (
    <Form className="float-right ml-2 d-flex">
      <Form.Control
        type="range"
        className="flex-grow-1"
        size="sm"
        min={0}
        max={5}
        value={weight}
        onInput={(event: any) => {
          onWeightChange(event.target.valueAsNumber);
        }}
      />
    </Form>
  );
};

type TaskModelLeaderboardTableProps = {
  data: any;
  enableWeights: any;
  metrics: any;
  setMetricWeight: any;
  enableDatasetWeights: any;
  datasetWeights: any;
  setDatasetWeight: any;
  sort: any;
  toggleSort: any;
  modelColumnTitle: any;
  showUserNames: boolean;
  multiplyResultsByHundred: boolean;
};

const arePropsEqual = (prevProps: any, nextProps: any) => {
  return (
    prevProps.enableWeights === nextProps.enableWeights &&
    prevProps.metrics === nextProps.metrics &&
    prevProps.enableDatasetWeights === nextProps.enableDatasetWeights &&
    prevProps.datasetWeights === nextProps.datasetWeights &&
    prevProps.sort === nextProps.sort &&
    prevProps.toggleSort === nextProps.toggleSort &&
    prevProps.modelColumnTitle === nextProps.modelColumnTitle &&
    prevProps.showUserNames === nextProps.showUserNames &&
    prevProps.multiplyResultsByHundred === nextProps.multiplyResultsByHundred &&
    prevProps.data === nextProps.data &&
    prevProps.setMetricWeight === nextProps.setMetricWeight &&
    prevProps.setDatasetWeight === nextProps.setDatasetWeight
  );
};

const TaskModelLeaderboardTable: FC<TaskModelLeaderboardTableProps> = memo(
  ({
    data,
    enableWeights,
    metrics,
    setMetricWeight,
    enableDatasetWeights,
    datasetWeights,
    setDatasetWeight,
    sort,
    toggleSort,
    modelColumnTitle,
    showUserNames,
    multiplyResultsByHundred,
  }) => {
    const metricColumnWidth =
      60 / ((metrics?.length ?? 0) === 0 ? 1 : metrics.length);

    const showDynascore = metrics && metrics.length !== 1;

    return (
      <Table hover className="mb-0">
        {metrics && metrics.length > 0 && (
          <>
            <thead>
              <tr>
                {!enableWeights && (
                  <th className="align-baseline" style={{ width: "25%" }}>
                    <SortContainer
                      sortKey={"model"}
                      toggleSort={toggleSort}
                      currentSort={sort}
                      className=""
                    >
                      {modelColumnTitle ? modelColumnTitle : "Model"}
                    </SortContainer>
                  </th>
                )}
                {enableWeights && <th className="align-top">Metric Weights</th>}

                {metrics?.map((metric: any) => {
                  return (
                    <MetricWeightTableHeader
                      metric={metric}
                      colWidth={metricColumnWidth}
                      setMetricWeight={setMetricWeight}
                      enableWeights={enableWeights}
                      sort={sort}
                      toggleSort={toggleSort}
                      key={`th-metric-${metric.id}`}
                    />
                  );
                })}
                {showDynascore && (
                  <th
                    className="pr-4 text-right align-baseline "
                    style={{ width: "15%" }}
                  >
                    <SortContainer
                      sortKey={"dynascore"}
                      toggleSort={toggleSort}
                      currentSort={sort}
                      className="d-flex justify-content-end align-items-center"
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
                )}
              </tr>
              {enableDatasetWeights && (
                <>
                  <tr>
                    <th className="align-top">Dataset Weights</th>
                    <th colSpan={metrics.length}>
                      <Container fluid className="px-0">
                        <Row>
                          {datasetWeights?.map((dataset: any) => {
                            return (
                              <Col xs={12} sm={6} md={3}>
                                <WeightPopover
                                  label={dataset.name}
                                  weight={dataset.weight}
                                >
                                  <span className="d-flex align-items-center justify-content-end">
                                    {dataset.name}&nbsp;
                                    <svg width={10} height={12}>
                                      {[...Array(dataset.weight)].map(
                                        (x, i) => (
                                          <rect
                                            key={"" + i}
                                            width="10"
                                            height="1"
                                            x={0}
                                            y={10 - i * 2}
                                            className="weight-indicator"
                                          />
                                        ),
                                      )}
                                    </svg>
                                  </span>
                                </WeightPopover>
                                <div>
                                  <WeightSlider
                                    weight={dataset.weight}
                                    onWeightChange={(newWeight: any) => {
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
              {data?.map((data: any, key: number) => (
                <TaskModelLeaderboardRow
                  key={key}
                  data={data}
                  showDynascore={showDynascore}
                  showUserNames={showUserNames}
                  multiplyResultsByHundred={multiplyResultsByHundred}
                />
              ))}
            </tbody>
          </>
        )}
      </Table>
    );
  },
  arePropsEqual,
);

export default TaskModelLeaderboardTable;
