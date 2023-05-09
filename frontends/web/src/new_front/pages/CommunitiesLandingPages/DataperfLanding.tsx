import React, { FC } from "react";
import useTasks from "../../hooks/useTasks";
import TaskCard from "../../components/Cards/TaskCard";

const DataperfLanding: FC = () => {
  const { tasksData, tasksCategories } = useTasks();
  const [openTab, setOpenTab] = React.useState(1);

  return (
    <div className="container text-center d-block">
      <div className="h-52">
        <h2 className="pt-4 text-6xl font-thin text-letter-color">DataPerf</h2>
        <h5 className="text-2xl font-thin text-letter-color">
          Benchmarking Data-Centric AI
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
                <p className="text-xl font-normal text-letter-color pb-8">
                  Dataperf invites you to demonstrate the power of your
                  algorithms on these data-centric benchmarks
                </p>
                <div
                  className="grid grid-cols-1 gap-4 pb-2 md:grid-cols-4"
                  key="Dataperf"
                >
                  {tasksData
                    .filter((t) => t.challenge_type === 2)
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
                        />
                      </div>
                    ))}
                </div>
              </div>
              <div className={openTab === 2 ? "block" : "hidden"} id="link2">
                <p>
                  We, researchers from Coactive.AI, ETH Zurich, Google, Harvard
                  University, Landing.AI, Meta, Stanford University, and TU
                  Eindhoven, are announcing DataPerf, a new benchmark suite for
                  machine learning datasets and data-centric algorithms. We are
                  presenting DataPerf at the NeurIPS Data-centric AI Workshop.
                  Going forward, we invite you to join us in defining and
                  developing the benchmark suite in the DataPerf Working Group
                  hosted by the MLCommons® Association. If you are interested in
                  using the DataPerf benchmark or participating in leaderboards
                  and challenges based on DataPerf in 2022, please sign up for
                  DataPerf-announce (click link then "Ask to Join").
                  <br />
                  <br />
                  Introduction. DataPerf is a benchmark suite for ML datasets
                  and data-centric algorithms. Historically, ML research has
                  focused primarily on models, and simply used the largest
                  existing dataset for common ML tasks without considering the
                  dataset’s breadth, difficulty, and fidelity to the underlying
                  problem. This under-focus on data has led to a range of
                  issues, from data cascades in real applications, to saturation
                  of existing dataset-driven benchmarks for model quality
                  impeding research progress. In order to catalyze increased
                  research focus on data quality and foster data excellence, we
                  created DataPerf: a suite of benchmarks that evaluate the
                  quality of training and test data, and the algorithms for
                  constructing or optimizing such datasets, such as core set
                  selection or labeling error debugging, across a range of
                  common ML tasks such as image classification. We plan to
                  leverage the DataPerf benchmarks through challenges and
                  leaderboards.
                  <br />
                  <br />
                  Inspiration. We are motivated by a number of prior efforts
                  including: efforts to develop adversarial data such as Cats4ML
                  and Dynabench, efforts to develop specific benchmarks or
                  similar suites such as the DCAI competition and DCBench, and
                  the MLPerf™ benchmarks for ML speed. We aim to provide clear
                  evaluation and encourage rapid innovation aimed at conferences
                  and workshops such as the NeurIPS Datasets and Benchmarks
                  track. Similar to the MLPerf effort, we’ve brought together
                  the leaders of these motivating efforts to build DataPerf.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataperfLanding;
