import React, { FC, useState } from "react";
import useTasks from "../../hooks/useTasks";
import TaskCard from "../../components/Cards/TaskCard";

const Test: FC = () => {
  const { tasksData, tasksCategories } = useTasks();
  const [openTab, setOpenTab] = React.useState(1);

  return (
    <>
      <div className="container text-center d-block">
        <div className="h-42">
          <h2 className="pt-8 text-6xl font-thin text-letter-color">DADC</h2>
          <h5 className="pt-2 text-2xl font-thin text-letter-color">
            Dynamic Adversarial Data Collection
          </h5>
        </div>
        <div className="flex flex-wrap min-w-full">
          <div>
            <ul
              className="w-full flex mb-0 list-none flex-wrap pt-3 pb-4 flex-row"
              role="tablist"
            >
              <li className="-mb-px mr-2 last:mr-0 flex-auto text-center">
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
                      className="h-5 w-5 flex-shrink-0 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                      />
                    </svg>
                    <span className="ml-3 text-base font-medium text-gray-900">
                      Challenges
                    </span>
                  </div>
                </a>
              </li>
              <li className="-mb-px mr-2 last:mr-0 flex-auto text-center">
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
                      className="h-5 w-5 flex-shrink-0 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                      />
                    </svg>
                    <span className="ml-3 text-base font-medium text-gray-900">
                      Overview
                    </span>
                  </div>
                </a>
              </li>
              <li className="-mb-px mr-2 last:mr-0 flex-auto text-center">
                <a
                  className="relative block p-4"
                  onClick={(e) => {
                    e.preventDefault();
                    setOpenTab(3);
                  }}
                  data-toggle="tab"
                  href="#link1"
                  role="tablist"
                >
                  <span
                    className={
                      "absolute inset-x-0 -bottom-px h-px w-full" +
                      (openTab === 3 ? " bg-primary-color" : "")
                    }
                  ></span>
                  <div className="flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 flex-shrink-0 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                      />
                    </svg>
                    <span className="ml-3 text-base font-medium text-gray-900">
                      Other Challenges
                    </span>
                  </div>
                </a>
              </li>
            </ul>
            <div>
              <div className="px-4 flex-auto">
                <div className="tab-content tab-space">
                  <div
                    className={openTab === 1 ? "block" : "hidden"}
                    id="link1"
                  >
                    <div>
                      <div>
                        <p className="text-xl font-normal text-letter-color py-4">
                          DADC invites you to find weaknesses in existing state
                          of the art AI models so that we can make them even
                          better.
                        </p>
                      </div>
                      <div className="pt-4">
                        <div>
                          <div
                            className="grid grid-cols-1 gap-4 pb-2 md:grid-cols-4"
                            key="Dataperf"
                          >
                            {tasksData
                              .filter((t) => t.challenge_type === 1)
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
                                  />
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className={openTab === 2 ? "block" : "hidden"}
                    id="link2"
                  >
                    <p>
                      We, researchers from Coactive.AI, ETH Zurich, Google,
                      Harvard University, Landing.AI, Meta, Stanford University,
                      and TU Eindhoven, are announcing DataPerf, a new benchmark
                      suite for machine learning datasets and data-centric
                      algorithms. We are presenting DataPerf at the NeurIPS
                      Data-centric AI Workshop. Going forward, we invite you to
                      join us in defining and developing the benchmark suite in
                      the DataPerf Working Group hosted by the MLCommons®
                      Association. If you are interested in using the DataPerf
                      benchmark or participating in leaderboards and challenges
                      based on DataPerf in 2022, please sign up for
                      DataPerf-announce (click link then "Ask to Join").
                      <br />
                      <br />
                      Introduction. DataPerf is a benchmark suite for ML
                      datasets and data-centric algorithms. Historically, ML
                      research has focused primarily on models, and simply used
                      the largest existing dataset for common ML tasks without
                      considering the dataset’s breadth, difficulty, and
                      fidelity to the underlying problem. This under-focus on
                      data has led to a range of issues, from data cascades in
                      real applications, to saturation of existing
                      dataset-driven benchmarks for model quality impeding
                      research progress. In order to catalyze increased research
                      focus on data quality and foster data excellence, we
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
                      including: efforts to develop adversarial data such as
                      Cats4ML and Dynabench, efforts to develop specific
                      benchmarks or similar suites such as the DCAI competition
                      and DCBench, and the MLPerf™ benchmarks for ML speed. We
                      aim to provide clear evaluation and encourage rapid
                      innovation aimed at conferences and workshops such as the
                      NeurIPS Datasets and Benchmarks track. Similar to the
                      MLPerf effort, we’ve brought together the leaders of these
                      motivating efforts to build DataPerf.
                    </p>
                  </div>
                  <div
                    className={openTab === 3 ? "block" : "hidden"}
                    id="link3"
                  >
                    <div>
                      <div></div>
                      <div className="pt-4">
                        <div>
                          <div
                            className="grid grid-cols-1 gap-4 pb-2 md:grid-cols-4"
                            key="Other"
                          >
                            {tasksData
                              .filter((t) => t.challenge_type !== 1)
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
                                  />
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Test;
