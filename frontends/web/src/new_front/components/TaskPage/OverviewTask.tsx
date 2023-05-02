import React, { FC, useState } from "react";
import MDEditor from "@uiw/react-md-editor";
import TabOptionVertical from "new_front/components/Buttons/TabOptionVertical";

type OverviewTaskProps = {
  roundDescription: string;
  generalDescription: string;
  taskInstructions: any;
};

const OverviewTask: FC<OverviewTaskProps> = ({
  roundDescription,
  generalDescription,
  taskInstructions,
}) => {
  console.log(taskInstructions, "3");
  const [openTab, setOpenTab] = useState(1);
  return (
    <>
      <div className="grid grid-cols-6 border">
        <div>
          <aside className="flex flex-col w-40 h-screen px-3 py-1 overflow-y-auto bg-white border-r rtl:border-r-0 rtl:border-l ">
            <div className="flex flex-col justify-between flex-1 mt-6">
              <nav className="flex-1 -mx-3 space-y-3 ">
                <ul className="flex flex-row flex-wrap" role="tablist">
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
              } col-span-4 mt-[32px]`}
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
