import React, { FC, useState } from "react";
import { Link } from "react-router-dom";
import ChevronExpandButton from "new_front/components/Buttons/ChevronExpandButton";

type TaskModelLeaderboardRowProps = {
  data: any;
};

const TaskModelLeaderboardRow: FC<TaskModelLeaderboardRowProps> = ({
  data,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [secondExpanded, setSecondExpanded] = useState(false);
  const totalRows = expanded ? data.datasets.length + 1 : 1;
  return (
    <>
      <tr key={data.model_id} onClick={() => setExpanded(!expanded)}>
        <td>
          <Link to={`/models/${data.model_id}`} className="btn-link">
            {data.model_name}
          </Link>
          <Link to={`/users/${data.uid}#profile`} className="btn-link">
            ({data.username})
          </Link>
          <div style={{ float: "right" }}>
            <ChevronExpandButton expanded={expanded} />
          </div>
        </td>
        {data.averaged_scores.map((score: any) => (
          <td className="text-right">{parseFloat(score).toFixed(2)}</td>
        ))}
        <td className="text-right align-middle pr-4 " rowSpan={totalRows}>
          <span>
            {expanded ? (
              <h1>{parseFloat(data.dynascore).toFixed(2)}</h1>
            ) : (
              parseFloat(data.dynascore).toFixed(2)
            )}
          </span>
        </td>
      </tr>
      {expanded &&
        data.datasets.map((dataset: any) => (
          <TaskModelLeaderboardRowFirstLevel
            dataset={dataset}
            secondExpanded={secondExpanded}
            setSecondExpanded={setSecondExpanded}
          />
        ))}
    </>
  );
};

type TaskModelLeaderboardRowFirstLevelProps = {
  dataset: any;
  secondExpanded: boolean;
  setSecondExpanded: any;
};

const TaskModelLeaderboardRowFirstLevel: FC<TaskModelLeaderboardRowFirstLevelProps> =
  ({ dataset, secondExpanded, setSecondExpanded }) => {
    return (
      <>
        <tr
          key={dataset.name}
          onClick={() => setSecondExpanded(!secondExpanded)}
        >
          <td>
            {dataset.name}
            {dataset.downstream_info && (
              <div style={{ float: "right" }}>
                <ChevronExpandButton expanded={secondExpanded} />
              </div>
            )}
          </td>
          {dataset.scores.map((score: any, i: number) => (
            <td className="text-right" key={`score-${dataset.id}-${i}-overall`}>
              {parseFloat(score).toFixed(2)}
            </td>
          ))}
        </tr>
        {secondExpanded &&
          dataset.downstream_info.map((downstream: any, i: number) => (
            <TaskModelLeaderboardRowSecondLevel downstream={downstream} />
          ))}
      </>
    );
  };

type TaskModelLeaderboardRowSecondLevelProps = {
  downstream: any;
};

const TaskModelLeaderboardRowSecondLevel: FC<TaskModelLeaderboardRowSecondLevelProps> =
  ({ downstream }) => {
    return (
      <>
        <tr key={downstream.name}>
          <td>{downstream.sub_task}</td>
          <td
            className="text-right"
            key={`score-${downstream.sub_task}-downstream`}
          >
            {parseFloat(downstream.score).toFixed(2)}
          </td>
        </tr>
      </>
    );
  };

export default TaskModelLeaderboardRow;
