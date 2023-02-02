/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { FC } from "react";
import { useHistory } from "react-router-dom";
import { TaskCardProps } from "../../types/task/taskCard";

const TaskCard: FC<TaskCardProps> = ({
  id,
  name,
  description,
  curRound,
  totalCollected,
  totalFooled,
  taskCode,
  imageUrl,
  tasksCategories,
}) => {
  const history = useHistory();
  return (
    <>
      <div
        className="max-w-sm transition duration-500 transform bg-white shadow-lg h-[30rem] rounded-xl hover:scale-105 cursor-pointer"
        onClick={() => history.push(`/tasks/${taskCode}`)}
      >
        <div className="relative">
          <img
            className="w-full h-48 rounded-t-xl"
            src={imageUrl}
            alt="Colors"
          />
        </div>
        <div className="px-4">
          <h1 className="mt-4 text-xl font-bold text-gray-800 cursor-pointer line-clamp-2 h-14">
            {name}
          </h1>
          <p className="line-clamp-3 h-[4.5rem]">{description}</p>
          <div className="h-20 pt-1 my-2 border-t border-gray-200">
            <div className="flex items-center space-x-1">
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-[#ff6d6a] mb-1.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </span>
              <p>Round: {curRound}</p>
            </div>
            <div className="flex items-center space-x-1">
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-[#ff6d6a] mb-1.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </span>
              <p>
                Model error:{" "}
                {totalCollected > 0
                  ? ((100 * totalFooled) / totalCollected).toFixed(2)
                  : "0.00"}
                % ({totalFooled}/{totalCollected})
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center max-w-full pt-2 bg-white border-t border-gray-200 justify-left">
            {tasksCategories
              .filter((category) => category.id_task === id)
              .map((category) => (
                <>
                  <span className="inline-flex items-center px-1 py-1 m-1 text-[0.775rem] font-semibold rounded-full bg-secondary-color text-letter-color"></span>
                  <span className="pr-3 text-letter-color">
                    {category.name}
                  </span>
                </>
              ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskCard;
