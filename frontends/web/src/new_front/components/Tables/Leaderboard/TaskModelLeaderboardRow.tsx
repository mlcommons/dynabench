import React, { FC, useEffect, useState, memo } from "react";
import { Link } from "react-router-dom";
import ChevronExpandButton from "new_front/components/Buttons/ChevronExpandButton";

type TaskModelLeaderboardRowProps = {
  data: any;
  showDynascore: boolean;
  showUserNames: boolean;
  multiplyResultsByHundred?: boolean;
};

const areRowPropsEqual = (
  prevProps: TaskModelLeaderboardRowProps,
  nextProps: TaskModelLeaderboardRowProps,
) => {
  return (
    prevProps.showDynascore === nextProps.showDynascore &&
    prevProps.showUserNames === nextProps.showUserNames &&
    prevProps.multiplyResultsByHundred === nextProps.multiplyResultsByHundred &&
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
  );
};

const TaskModelLeaderboardRow: FC<TaskModelLeaderboardRowProps> = memo(
  ({
    data,
    showDynascore,
    showUserNames,
    multiplyResultsByHundred = false,
  }) => {
    const [expanded, setExpanded] = useState(false);
    const [secondExpanded, setSecondExpanded] = useState();
    const totalRows = expanded ? data.datasets.length + 1 : 1;

    useEffect(() => {
      setSecondExpanded(
        data?.datasets?.reduce((acc: any, dataset: any) => {
          acc[dataset.name] = false;
          return acc;
        }, {}),
      );
    }, []);

    return (
      <>
        <tr key={data.model_id} onClick={() => setExpanded(!expanded)}>
          <td>
            <Link to={`/models/${data.model_id}`} className="btn-link">
              {data.model_name}
            </Link>
            {showUserNames && (
              <Link to={`/users/${data.uid}#profile`} className="btn-link">
                ({data.username})
              </Link>
            )}
            <div style={{ float: "right" }}>
              <ChevronExpandButton expanded={expanded} />
            </div>
          </td>
          {multiplyResultsByHundred ? (
            <>
              {data.averaged_scores.map((score: any, index: number) => (
                <td className="text-right" key={index}>
                  {(parseFloat(score) * 100).toFixed(2)}
                </td>
              ))}
            </>
          ) : (
            <>
              {data.averaged_scores.map((score: any, index: number) => (
                <td className="text-right" key={index}>
                  {parseFloat(score).toFixed(2)}
                </td>
              ))}
            </>
          )}

          {showDynascore && (
            <td className="pr-4 text-right align-middle " rowSpan={totalRows}>
              <span>
                {expanded ? (
                  <h1>{parseFloat(data.dynascore).toFixed(2)}</h1>
                ) : (
                  parseFloat(data.dynascore).toFixed(2)
                )}
              </span>
            </td>
          )}
        </tr>
        {expanded &&
          data.datasets.map((dataset: any, i: number) => (
            <TaskModelLeaderboardRowFirstLevel
              key={i}
              dataset={dataset}
              secondExpanded={secondExpanded}
              setSecondExpanded={setSecondExpanded}
              multiplyResultsByHundred={multiplyResultsByHundred}
            />
          ))}
      </>
    );
  },
  areRowPropsEqual,
);

type TaskModelLeaderboardRowFirstLevelProps = {
  dataset: any;
  secondExpanded: any;
  setSecondExpanded: any;
  multiplyResultsByHundred?: boolean;
};

const TaskModelLeaderboardRowFirstLevel: FC<
  TaskModelLeaderboardRowFirstLevelProps
> = ({
  dataset,
  secondExpanded,
  setSecondExpanded,
  multiplyResultsByHundred = false,
}) => {
  return (
    <>
      <tr
        key={dataset.name}
        onClick={() =>
          setSecondExpanded((prevState: any) => ({
            ...prevState,
            [dataset.name]: !secondExpanded[dataset.name],
          }))
        }
      >
        <td className="pl-3">
          {dataset.name}
          {dataset.downstream_info && (
            <div style={{ float: "right" }}>
              <ChevronExpandButton expanded={secondExpanded[dataset.name]} />
            </div>
          )}
        </td>
        {multiplyResultsByHundred ? (
          <>
            {dataset.scores.map((score: any, i: number) => (
              <td
                className="text-right"
                key={`score-${dataset.id}-${i}-overall`}
              >
                {(parseFloat(score) * 100).toFixed(2)}
              </td>
            ))}
          </>
        ) : (
          <>
            {dataset.scores.map((score: any, i: number) => (
              <td
                className="text-right"
                key={`score-${dataset.id}-${i}-overall`}
              >
                {parseFloat(score).toFixed(2)}
              </td>
            ))}
          </>
        )}
      </tr>
      {secondExpanded[dataset.name] &&
        dataset.downstream_info &&
        dataset.downstream_info.map((downstream: any, i: number) => (
          <TaskModelLeaderboardRowSecondLevel
            key={i}
            downstream={downstream}
            multiplyResultsByHundred={multiplyResultsByHundred}
          />
        ))}
    </>
  );
};

type TaskModelLeaderboardRowSecondLevelProps = {
  downstream: any;
  multiplyResultsByHundred?: boolean;
};

const TaskModelLeaderboardRowSecondLevel: FC<
  TaskModelLeaderboardRowSecondLevelProps
> = ({ downstream, multiplyResultsByHundred = false }) => {
  return (
    <>
      <tr key={downstream.name}>
        <td className="pl-5">{downstream.sub_task} </td>

        <td
          className="text-right"
          key={`score-${downstream.sub_task}-downstream`}
        >
          {multiplyResultsByHundred ? (
            <>{(parseFloat(downstream.score) * 100).toFixed(2)}</>
          ) : (
            <>{parseFloat(downstream.score).toFixed(2)}</>
          )}
        </td>
      </tr>
    </>
  );
};

export default TaskModelLeaderboardRow;
