import React, { FC } from "react";
import useTasks from "../../hooks/useTasks";
import TaskCard from "../../components/Cards/TaskCard";

const MachineTranslationLanding: FC = () => {
  const { tasksData, tasksCategories } = useTasks();
  const [openTab, setOpenTab] = React.useState(1);

  return (
    <div className="container text-center d-block">
      <div className="h-52">
        <h2 className="pt-4 text-6xl font-thin text-letter-color">
          Machine Translation
        </h2>
        <h5 className="text-2xl font-thin text-letter-color">
          Benchmarking Machine Translation
        </h5>
      </div>
      <div>
        <div>
          <ul
            className="flex flex-row flex-wrap w-full pb-4 mb-0 list-none"
            role="tablist"
          >
            <li className="flex-auto mr-2 -mb-px text-center last:mr-0">
              <a
                className="relative block p-4"
                onClick={(e) => {
                  e.preventDefault();
                  setOpenTab(1);
                }}
                data-toggle="tab"
                href="#link1"
                role="tablist"
              >
                <span
                  className={
                    "absolute inset-x-0 -bottom-px h-px w-full" +
                    (openTab === 1 ? " bg-primary-color" : "")
                  }
                ></span>
                <div className="flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="flex-shrink-0 w-5 h-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                  <span className="ml-3 text-base font-medium text-gray-900">
                    Challenges
                  </span>
                </div>
              </a>
            </li>
            <li className="flex-auto mr-2 -mb-px text-center last:mr-0">
              <a
                className="relative block p-4"
                onClick={(e) => {
                  e.preventDefault();
                  setOpenTab(2);
                }}
                data-toggle="tab"
                href="#link1"
                role="tablist"
              >
                <span
                  className={
                    "absolute inset-x-0 -bottom-px h-px w-full" +
                    (openTab === 2 ? " bg-primary-color" : "")
                  }
                ></span>
                <div className="flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="flex-shrink-0 w-5 h-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                  <span className="ml-3 text-base font-medium text-gray-900">
                    Overview
                  </span>
                </div>
              </a>
            </li>
          </ul>
        </div>
        <div className="pt-4">
          <div className="tab-content tab-space">
            <div>
              <div className={openTab === 1 ? "block" : "hidden"} id="link1">
                <p className="pb-8 text-xl font-normal text-letter-color">
                  Do you want to participate in the Machine Translation
                  challenges? Here are the available challenges for you to
                  participate in.
                </p>
                <div
                  className="grid grid-cols-1 gap-4 pb-2 md:grid-cols-4"
                  key="Dataperf"
                >
                  {tasksData
                    .filter((t) => t.challenge_type === 7)
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
              <div className={openTab === 2 ? "block" : "hidden"} id="link2">
                <p>
                  Our community is dedicated to advancing the field of machine
                  translation through collaborative benchmark creation. By
                  bringing together experts and enthusiasts from diverse
                  backgrounds, we aim to develop comprehensive evaluation
                  metrics and datasets for various translation tasks. Join us to
                  contribute to the evolution of machine translation technology
                  and foster innovation in language processing.
                  <br />
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MachineTranslationLanding;
