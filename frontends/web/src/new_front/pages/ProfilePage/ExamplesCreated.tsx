import React, { useContext, useEffect, useState } from "react";
import { Typeahead } from "react-bootstrap-typeahead";
import ExampleCreated from "new_front/components/ProfilePage/ExamplesCreated/ExampleCreated";
import useFetch from "use-http";
import UserContext from "containers/UserContext";

const ExamplesCreated = () => {
  const { get, response } = useFetch();
  const [tasksData, setTasksData] = useState<any>();
  const [taskId, setTaskId] = useState<any>();
  const { user } = useContext(UserContext);

  const getTasks = async () => {
    if (!user.id) {
      return;
    }
    const tasks = await get(
      `/task/get_tasks_with_samples_created_by_user/${user.id}`
    );
    if (response.ok) {
      setTasksData(tasks);
    }
  };

  useEffect(() => {
    getTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {tasksData && (
        <div className="container max-w-5xl">
          <div className="pt-8 pl-16 ">
            <h3 className="text-2xl font-bold">Tasks</h3>
            <Typeahead
              id="basic-typeahead-single"
              labelKey="name"
              className="py-2"
              options={tasksData.map((task: { name: string; id: number }) => {
                return {
                  name: task.name,
                  id: task.id,
                };
              })}
              placeholder="Choose a task..."
              onChange={(selected) => {
                if (selected.length > 0) {
                  setTaskId(selected[0]);
                  console.log(selected[0]);
                }
              }}
              clearButton
            />
          </div>
          {taskId && (
            <div className="items-center content-center">
              <ExampleCreated taskId={taskId.id} />
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ExamplesCreated;
