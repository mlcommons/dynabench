/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { FC } from "react";
import { useHistory } from "react-router-dom";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import { TaskCategories } from "new_front/types/task/taskCategories";

type TaskCardProps = {
  id: number;
  name: string;
  description: string;
  curRound: number;
  totalCollected: number;
  totalFooled: number;
  taskCode: string;
  imageUrl: string;
  tasksCategories: TaskCategories[];
  isBuilding?: number;
  isFinished?: number;
};

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
  isBuilding,
  isFinished,
}) => {
  const history = useHistory();
  return (
    <>
      <div
        className="max-w-sm transition duration-500 transform bg-white shadow-md h-[30rem] rounded-xl hover:scale-105 cursor-pointer"
        onClick={
          isBuilding !== 0 || isFinished !== 0
            ? () => {}
            : () => history.push(`/tasks/${taskCode}`)
        }
        key={id}
      >
        <div className="relative">
          {isBuilding === 1 && (
            <span className="rotate-[-35deg] absolute top-0 left-0 z-10 inline-flex px-3 py-1 mt-[21px] text-sm font-medium text-white rounded-lg select-none bg-green-500">
              Building
            </span>
          )}
          {isFinished === 1 && (
            <span className="rotate-[-35deg] absolute top-0 left-0 z-10 inline-flex px-3 py-1 mt-[21px] text-sm font-medium text-white rounded-lg select-none bg-secondary-color ">
              Finished
            </span>
          )}
          <LazyLoadImage
            className="w-full h-48 rounded-t-xl"
            src={imageUrl}
            alt="blur"
            effect="blur"
            width={"100%"}
            height={"100%"}
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
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
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
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
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
