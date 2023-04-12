import React, { FC } from "react";
import MDEditor from "@uiw/react-md-editor";
import useFetch from "use-http";
import { OverviewTaskInstructions } from "new_front/types/task/overviewTaskInstructions";

type OverviewTaskProps = {
  roundDescription: string;
  generalDescription: string;
  taskId: number;
};

const OverviewTask: FC<OverviewTaskProps> = ({
  roundDescription,
  generalDescription,
  taskId,
}) => {
  const [taskInstructions, setTaskInstructions] =
    React.useState<OverviewTaskInstructions>();

  const { get, loading, response } = useFetch();

  const getTaskInstructions = async (taskId: string) => {
    const taskInstructions = await get(`/task/get_task_instructions/${taskId}`);
    if (response.ok) {
      setTaskInstructions(taskInstructions);
    }
  };

  return (
    <>
      <div className="grid grid-cols-6 border">
        <div>
          <aside className="flex flex-col w-40 h-screen px-3 py-1 overflow-y-auto bg-white border-r rtl:border-r-0 rtl:border-l ">
            <div className="flex flex-col justify-between flex-1 mt-6">
              <nav className="flex-1 -mx-3 space-y-3 ">
                <a
                  className="flex items-center px-2 py-1 transition-colors duration-300 transform rounded-lg text-letter-color hover:bg-gray-100 hover:text-gray-700"
                  href="/"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                    />
                  </svg>
                  <span className="mx-2 text-lg font-medium  text-letter-color">
                    Description
                  </span>
                </a>
              </nav>
            </div>
          </aside>
        </div>
        <div className="col-span-4 mt-[32px]">
          <h3 className="text-2xl font-bold text-letter-color">
            General Description
          </h3>
          <div
            data-color-mode="light"
            className="mt-4 text-lg font-normal text-letter-color "
          >
            <MDEditor.Markdown source={generalDescription} />
          </div>
          <h3 className="mt-4 mb-4 text-2xl font-bold text-letter-color">
            Round Description
          </h3>
          <div
            className="mt-4 mb-16 text-base text-letter-color"
            dangerouslySetInnerHTML={{
              __html: roundDescription,
            }}
          ></div>
        </div>
      </div>
    </>
  );
};

export default OverviewTask;
