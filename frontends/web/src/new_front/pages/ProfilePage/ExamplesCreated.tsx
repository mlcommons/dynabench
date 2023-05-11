import useTasks from "new_front/hooks/useTasks";
import React from "react";
import { Typeahead } from "react-bootstrap-typeahead";

const ExamplesCreated = () => {
  const { tasksData } = useTasks();

  return (
    <>
      <div className="">
        <div className="pl-16 pt-8">
          <h3 className="text-2xl font-bold">Tasks</h3>
          <Typeahead
            id="basic-typeahead-single"
            labelKey="name"
            className="w-full py-2"
            options={tasksData.map((task) => {
              return {
                name: task.name,
                id: task.id,
              };
            })}
            clearButton
          />
        </div>
      </div>
    </>
  );
};

export default ExamplesCreated;
