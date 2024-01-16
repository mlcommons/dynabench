import React, { FC, useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import TabOptionVertical from "new_front/components/Buttons/TabOptionVertical";

type OverviewTaskProps = {
  taskInstructions: any;
};

const OverviewTask: FC<OverviewTaskProps> = ({ taskInstructions }) => {
  console.log(taskInstructions, "3");
  const [openTab, setOpenTab] = useState(1);
  return (
    <>
      <div className="pb-8 border md:grid md:grid-cols-6">
        <div>
          <aside className="flex px-3 py-1 mx-auto overflow-y-auto bg-white border-r md:h-screen md:w-36 rtl:border-r-0 rtl:border-l ">
            <div className="flex flex-row justify-between flex-1 mt-6">
              <nav className="flex-1 -mx-3 space-y-3 ">
                <ul className="flex flex-col flex-wrap" role="tablist">
                  {taskInstructions &&
                    Object.keys(taskInstructions).map((key, index) => (
                      <TabOptionVertical
                        key={index}
                        optionTab={index + 1}
                        tabName={key}
                        openTab={openTab}
                        setOpenTab={setOpenTab}
                      />
                    ))}
                </ul>
              </nav>
            </div>
          </aside>
        </div>

        {taskInstructions &&
          Object.keys(taskInstructions).map((key, index) => (
            <div
              key={index}
              className={`${
                openTab === index + 1 ? "block" : "hidden"
              } col-span-5 mt-[32px] mx-10`}
            >
              <div data-color-mode="light" className="mt-4 ">
                <MDEditor.Markdown source={taskInstructions[key]} />
              </div>
            </div>
          ))}
      </div>
    </>
  );
};

export default OverviewTask;
