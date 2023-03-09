import React from "react";
import ContentLoader from "react-content-loader";

const TasksSkeleton = () => {
  return (
    <div>
      <div className="grid w-full grid-cols-1 gap-6 mt-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div className="relative w-full p-4 overflow-hidden bg-white rounded-lg shadow hover:shadow-md">
          <div className="flex flex-col animate-pulse">
            <div className="w-full bg-gray-200 rounded h-52"></div>
            <div className="flex flex-col mt-5">
              <div className="w-full h-5 bg-gray-200 rounded"></div>
              <div className="w-10/12 h-3 mt-2 bg-gray-200 rounded"></div>
              <div className="w-8/12 h-3 mt-2 bg-gray-200 rounded"></div>
            </div>

            <div className="grid grid-cols-2 mt-5 gap-x-2 gap-y-1">
              <div className="w-full h-3 mt-2 bg-gray-200 rounded"></div>
              <div className="w-full h-3 mt-2 bg-gray-200 rounded"></div>
              <div className="w-full h-3 mt-2 bg-gray-200 rounded"></div>
              <div className="w-full h-3 mt-2 bg-gray-200 rounded"></div>
            </div>

            <div className="flex items-center mt-5">
              <div>
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              </div>
              <div className="flex justify-between w-full ml-3">
                <div className="w-5/12 h-3 bg-gray-200 rounded"></div>
                <div className="w-2/12 h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative w-full p-4 overflow-hidden bg-white rounded-lg shadow hover:shadow-md">
          <div className="flex flex-col animate-pulse">
            <div className="w-full bg-gray-200 rounded h-52"></div>
            <div className="flex flex-col mt-5">
              <div className="w-full h-5 bg-gray-200 rounded"></div>
              <div className="w-10/12 h-3 mt-2 bg-gray-200 rounded"></div>
              <div className="w-8/12 h-3 mt-2 bg-gray-200 rounded"></div>
            </div>

            <div className="grid grid-cols-2 mt-5 gap-x-2 gap-y-1">
              <div className="w-full h-3 mt-2 bg-gray-200 rounded"></div>
              <div className="w-full h-3 mt-2 bg-gray-200 rounded"></div>
              <div className="w-full h-3 mt-2 bg-gray-200 rounded"></div>
              <div className="w-full h-3 mt-2 bg-gray-200 rounded"></div>
            </div>

            <div className="flex items-center mt-5">
              <div>
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              </div>
              <div className="flex justify-between w-full ml-3">
                <div className="w-5/12 h-3 bg-gray-200 rounded"></div>
                <div className="w-2/12 h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative w-full p-4 overflow-hidden bg-white rounded-lg shadow hover:shadow-md">
          <div className="flex flex-col animate-pulse">
            <div className="w-full bg-gray-200 rounded h-52"></div>
            <div className="flex flex-col mt-5">
              <div className="w-full h-5 bg-gray-200 rounded"></div>
              <div className="w-10/12 h-3 mt-2 bg-gray-200 rounded"></div>
              <div className="w-8/12 h-3 mt-2 bg-gray-200 rounded"></div>
            </div>

            <div className="grid grid-cols-2 mt-5 gap-x-2 gap-y-1">
              <div className="w-full h-3 mt-2 bg-gray-200 rounded"></div>
              <div className="w-full h-3 mt-2 bg-gray-200 rounded"></div>
              <div className="w-full h-3 mt-2 bg-gray-200 rounded"></div>
              <div className="w-full h-3 mt-2 bg-gray-200 rounded"></div>
            </div>

            <div className="flex items-center mt-5">
              <div>
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              </div>
              <div className="flex justify-between w-full ml-3">
                <div className="w-5/12 h-3 bg-gray-200 rounded"></div>
                <div className="w-2/12 h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TasksSkeleton;
