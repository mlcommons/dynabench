import React from "react";

import { useState } from "react";

const MultiSelect = () => {
  return (
    <div>
      <h3 className="mb-4 font-semibold text-gray-900 ">
        Select all policy violations represented in the image
      </h3>
      <ul className="w-48 text-sm font-medium text-gray-900 border border-gray-200 rounded-lg dark:bg-gray-700 dark:border-gray-600 ">
        <li className="w-full border-b border-gray-200 rounded-t-lg dark:border-gray-600">
          <div className="flex items-center pl-3">
            <input
              id="vue-checkbox"
              type="checkbox"
              value=""
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
            />
            <label className="w-full py-3 ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
              Violent
            </label>
          </div>
        </li>
        <li className="w-full border-b border-gray-200 rounded-t-lg dark:border-gray-600">
          <div className="flex items-center pl-3">
            <input
              id="react-checkbox"
              type="checkbox"
              value=""
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
            />
            <label className="w-full py-3 ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
              Sexually
            </label>
          </div>
        </li>
        <li className="w-full border-b border-gray-200 rounded-t-lg dark:border-gray-600">
          <div className="flex items-center pl-3">
            <input
              id="angular-checkbox"
              type="checkbox"
              value=""
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
            />
            <label className="w-full py-3 ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
              Negative
            </label>
          </div>
        </li>
        <li className="w-full border-b border-gray-200 rounded-t-lg dark:border-gray-600">
          <div className="flex items-center pl-3">
            <input
              id="laravel-checkbox"
              type="checkbox"
              value=""
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
            />
            <label className="w-full py-3 ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
              Hate
            </label>
          </div>
        </li>
      </ul>
    </div>
  );
};
export default MultiSelect;
