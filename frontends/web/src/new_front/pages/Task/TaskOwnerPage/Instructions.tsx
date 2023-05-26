import React, { FC, useState, useEffect } from "react";
import useFetch from "use-http";
import { Button, Modal, Dropdown, DropdownButton } from "react-bootstrap";
import Swal from "sweetalert2";

type InstructionsProps = {
  taskId: number;
};

const Instructions: FC<InstructionsProps> = ({ taskId }) => {
  const { get, post, loading, response } = useFetch();
  const [instructions, setInstructions] = useState<any>();
  const [newInstructions, setNewInstructions] = useState<any>();
  const [newCategory, setNewCategory] = useState<any>();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showRemoveModal, setShowRemoveModal] = useState<boolean>(false);

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

  const handleNewCategory = async (key: string) => {
    setNewCategory(key);
  };

  const addNewCategory = async () => {
    handleSave({ ...newInstructions, [newCategory]: "" });
    setShowModal(false);
  };

  const removeCategory = async (key: string) => {
    const { [key]: value, ...rest } = newInstructions;
    handleSave(rest);
    setShowRemoveModal(false);
  };

  const handleUpdate = async () => {
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
      window.location.reload();
    }
  };

  const handleSave = async (instructions: any) => {
    await post(`/task/update_task_instructions`, {
      task_id: taskId,
      instructions: JSON.stringify(instructions),
    });
    if (response.ok) {
      Swal.fire({
        title: "Success!",
        text: "Instructions updated successfully!",
        icon: "success",
        confirmButtonText: "Ok",
      });
      window.location.reload();
    }
  };

  useEffect(() => {
    console.log("newInstructions", newInstructions);
  }, [newInstructions]);

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
              <div className="flex justify-center col-span-3 gap-8" id="submit">
                <Button
                  variant="primary"
                  className="max-w-xs my-4 submit-btn button-ellipse text-uppercase"
                  onClick={() => handleUpdate()}
                >
                  Save
                </Button>
                <div>
                  <Modal show={showModal} onHide={() => setShowModal(false)}>
                    <Modal.Header
                      closeButton
                      onHide={() => setShowModal(false)}
                    >
                      <Modal.Title>Create new category</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      <input
                        className="w-full p-3 rounded-1 thick-border bg-[#f0f2f5]"
                        onChange={(e) => handleNewCategory(e.target.value)}
                      />
                      <div
                        className="flex justify-center col-span-3 gap-8"
                        id="submit"
                      >
                        <Button
                          variant="primary"
                          className="max-w-xs my-4 submit-btn button-ellipse text-uppercase"
                          onClick={addNewCategory}
                        >
                          Save
                        </Button>
                      </div>
                    </Modal.Body>
                  </Modal>
                  <Button
                    variant="primary"
                    className="max-w-xs my-4 submit-btn button-ellipse text-uppercase"
                    onClick={() => setShowModal(true)}
                  >
                    Create new category
                  </Button>
                </div>
                <div>
                  <Button
                    variant="primary"
                    className="max-w-xs my-4 submit-btn button-ellipse text-uppercase"
                    onClick={() => setShowRemoveModal(true)}
                  >
                    Remove category
                  </Button>
                  <Modal
                    show={showRemoveModal}
                    onHide={() => setShowRemoveModal(false)}
                  >
                    <Modal.Header
                      closeButton
                      onHide={() => setShowRemoveModal(false)}
                    >
                      <Modal.Title>Remove category</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      <DropdownButton
                        id="dropdown-basic-button"
                        title="Select category"
                        className="flex justify-center w-full border-gray-200 "
                      >
                        {Object.keys(instructions).map((key) => (
                          <Dropdown.Item onClick={() => removeCategory(key)}>
                            {key}
                          </Dropdown.Item>
                        ))}
                      </DropdownButton>
                      <div
                        className="flex justify-center col-span-3 gap-8"
                        id="submit"
                      ></div>
                    </Modal.Body>
                  </Modal>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </>
  );
};

export default Instructions;
