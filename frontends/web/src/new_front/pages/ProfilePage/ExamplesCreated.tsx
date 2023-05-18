import useTasks from "new_front/hooks/useTasks";
import React, { useEffect, useState } from "react";
import { Typeahead } from "react-bootstrap-typeahead";
import ExampleCreated from "new_front/components/ProfilePage/ExamplesCreated/ExampleCreated";

const ExamplesCreated = () => {
  const { tasksData } = useTasks();
  const [taskId, setTaskId] = useState<any>();

  return (
    <>
      <div className="pt-8 pl-16">
        <h3 className="text-2xl font-bold">Tasks</h3>
        <Typeahead
          id="basic-typeahead-single"
          labelKey="name"
          className="py-2"
          options={tasksData.map((task) => {
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
    </>
  );
};

export default ExamplesCreated;
