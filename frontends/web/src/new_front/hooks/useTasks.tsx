import { useEffect, useState } from "react";
import useFetch from "use-http";
import { TaskInfoType } from "../../new_front/types/task/taskInfo";
import { TaskCategories } from "../../new_front/types/task/taskCategories";

const useTasks = () => {
  const [tasksData, setTasksData] = useState([] as TaskInfoType[]);
  const [tasksCategories, setTasksCategories] = useState<TaskCategories[]>([]);
  const { get, response } = useFetch();

  const getTaskData = async () => {
    const [tasksInfo, tasksCategoriesInfo] = await Promise.all([
      get("/task/get_active_tasks_with_round_info"),
      get("/task/get_tasks_categories"),
    ]);
    if (response.ok) {
      setTasksData(tasksInfo);
      setTasksCategories(tasksCategoriesInfo);
    }
  };

  useEffect(() => {
    getTaskData();
  }, []);

  return { tasksData, tasksCategories };
};

export default useTasks;
