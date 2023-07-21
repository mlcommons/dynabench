import React, { FC, useEffect } from "react";
import TaskCard from "../../components/Cards/TaskCard";
import useTasks from "../../hooks/useTasks";
import { useLocation } from "react-router-dom";

const FilterTasks: FC = () => {
  const search = useLocation().search;
  const searchParams = new URLSearchParams(search);

  const tasksFilter = searchParams.get("task")?.toLowerCase() || "";
  const { tasksData, tasksCategories } = useTasks();

  useEffect(() => {
    localStorage.removeItem("originalPath");
  }, []);

  return (
    <div className="bg-gradient-to-b from-white via-[#ccebd466] to-white">
      <div className="container text-center d-block">
        <div>
          <h2 className="text-4xl font-semibold text-center d-block text-letter-color">
            Challenges
          </h2>
        </div>
        <div>
          <div className="pt-4">
            <div>
              <div
                className="grid grid-cols-1 gap-4 pb-2 md:grid-cols-4"
                key="Dataperf"
              >
                {tasksData
                  .filter((t) =>
                    t.name.toString().toLowerCase().includes(tasksFilter)
                  )
                  .map((task) => (
                    <div key={task.id}>
                      <TaskCard
                        id={task.id}
                        name={task.name}
                        description={task.desc}
                        curRound={task.cur_round}
                        totalCollected={task.round.total_collected}
                        totalFooled={task.round.total_fooled}
                        taskCode={task.task_code}
                        imageUrl={task.image_url}
                        tasksCategories={tasksCategories}
                        isBuilding={task.is_building}
                        isFinished={task.is_finished}
                      />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterTasks;
