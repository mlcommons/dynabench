import React, { FC, useState, useEffect } from "react";
import useFetch from "use-http";
import { Button } from "react-bootstrap";
import Swal from "sweetalert2";

type InstructionsProps = {
  taskId: number;
};

const Instructions: FC<InstructionsProps> = ({ taskId }) => {
  const { get, post, loading, response } = useFetch();
  const [instructions, setInstructions] = useState<any>();
  const [newInstructions, setNewInstructions] = useState<any>();

  const getInstructions = async (taskId: number) => {
    const instructions = await get(`/task/get_task_instructions/${taskId}`);
    if (response.ok) {
      setInstructions(instructions);
      setNewInstructions(instructions);
    }
  };

  useEffect(() => {
    getInstructions(taskId);
  }, []);

  const handleInstructions = (key: string, value: string) => {
    setNewInstructions({ ...newInstructions, [key]: value });
  };

  const handleSave = async () => {
    await post(`/task/update_task_instructions`, {
      task_id: taskId,
      instructions: JSON.stringify(newInstructions),
    });
    if (response.ok) {
      Swal.fire({
        title: "Success!",
        text: "Instructions updated successfully!",
        icon: "success",
        confirmButtonText: "Ok",
      });
    }
    window.location.reload();
  };

  return (
    <>
      {!loading && instructions && (
        <form>
          <div className="flex flex-col">
            <div className="flex flex-col">
              {Object.keys(instructions).map((key) => (
                <div className="py-3 my-0">
                  <label className="text-2xl capitalize text-letter-color">
                    {key}
                  </label>
                  <textarea
                    className="w-full h-96 p-3 rounded-1 thick-border bg-[#f0f2f5]"
                    defaultValue={instructions[key]}
                    onChange={(e) => handleInstructions(key, e.target.value)}
                  />
                </div>
              ))}
              <div className="col-span-1 pl-2 pr-3" id="submit">
                <Button
                  className="border-0 font-weight-bold light-gray-bg task-action-btn"
                  onClick={handleSave}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}
    </>
  );
};

export default Instructions;
