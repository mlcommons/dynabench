import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { TaskModelDefaultLeaderboard } from "components/TaskLeaderboard/TaskModelLeaderboardCardWrapper";

type LeaderboardProps = {
  taskCode: string;
};

const Leaderboard = ({ taskCode }: LeaderboardProps) => {
  const [taskData, setTaskData] = useState();
  const history = useHistory();
  const getData = async () => {
    const response = await fetch(
      `${process.env.REACT_APP_API_HOST}/tasks/${taskCode}`,
    );
    const data = await response.json();
    setTaskData(data);
  };
  useEffect(() => {
    getData();
  }, []);

  return (
    <div>
      {taskData && (
        <TaskModelDefaultLeaderboard
          title="Leaderboard"
          task={taskData}
          history={history}
          taskCode={taskCode}
          percentageFormat={true}
          disableForkAndSnapshot={true}
          disableToggleSort={true}
          disableAdjustWeights={true}
          disablePagination={true}
          modelColumnTitle="Team"
          getInitialWeights={() => {}}
        />
      )}
    </div>
  );
};

export default Leaderboard;
