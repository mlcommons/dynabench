import React, { FC } from "react";
import { Button } from "react-bootstrap";
import useFetch from "use-http";
import Swal from "sweetalert2";
import { PacmanLoader } from "react-spinners";

type ValidationButtonActionsProps = {
  exampleId: number;
  userId: number;
  label: string;
  metadataExample: object;
  taskId: number;
  validateNonFooling: boolean;
  roundId: number;
};

const ValidationButtonActions: FC<ValidationButtonActionsProps> = ({
  exampleId,
  userId,
  label,
  metadataExample,
  taskId,
  validateNonFooling,
  roundId,
}) => {
  const { post, loading, response } = useFetch();

  const onSubmission = async () => {
    await post("/example/validate_example", {
      example_id: exampleId,
      user_id: userId,
      label: label,
      metadata_json: metadataExample,
      task_id: taskId,
      validate_non_fooling: validateNonFooling,
      round_id: roundId,
    });
    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "Example validated!",
        showConfirmButton: false,
        timer: 1500,
      });
      // window.location.reload();
    } else {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong!",
      });
    }
  };

  return (
    <>
      {!loading ? (
        <div className="col-span-1 py-4">
          <div className="grid grid-cols-6">
            <div className="flex justify-start col-span-3 ">
              <div className="col-span-1 pl-2 " id="submit">
                <Button
                  className="border-0 font-weight-bold light-gray-bg task-action-btn"
                  onClick={onSubmission}
                >
                  Submit
                </Button>
              </div>
              <div className="col-span-1 pl-2" id="switchContext">
                <Button
                  className="border-0 font-weight-bold light-gray-bg task-action-btn"
                  onClick={() => {
                    window.location.reload();
                  }}
                >
                  Skip and load a new example
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-32">
          <PacmanLoader color="#ccebd4" loading={loading} size={50} />
        </div>
      )}
    </>
  );
};

export default ValidationButtonActions;
