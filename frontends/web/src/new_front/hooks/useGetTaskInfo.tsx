import { useEffect, useState } from "react";
import useFetch from "use-http";
import { TaskInfoType } from "../../new_front/types/task/taskInfo";

const useGetTaskInfo = (taskId: number) => {
  const [taskData, setTaskData] = useState<TaskInfoType>();
  const { get, response } = useFetch();

  const getTaskData = async () => {
    const taskInfo = await get(
      `/task/get_task_with_round_info_by_task_id/${taskId}`
    );

    if (response.ok) {
      setTaskData(taskInfo);
    }
  };

  useEffect(() => {
    getTaskData();
  }, []);

  return taskData;
};

export default useGetTaskInfo;
