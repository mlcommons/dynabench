import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import React, { FC, useContext, useState } from "react";
import { Button, Modal } from "react-bootstrap";
import useFetch from "use-http";
import Swal from "sweetalert2";

type ExtraInfoProps = {
  bestAnswer: any;
  contextId: number;
  userId: number;
  showExtraInfo: boolean;
  setShowExtraInfo: (show: boolean) => void;
};

const ExtraInfoChatbot: FC<ExtraInfoProps> = ({
  bestAnswer,
  showExtraInfo,
  contextId,
  userId,
  setShowExtraInfo,
}) => {
  const [explanation, setExplanation] = useState("");
  const { post, response } = useFetch();

  const { modelInputs, updateModelInputs } = useContext(CreateInterfaceContext);

  const saveExplanation = async () => {
    updateModelInputs({
      generated_answers: explanation,
    });

    await post("/example/create_example", {
      context_id: contextId,
      user_id: userId,
      input_json: modelInputs,
    });
    if (response.ok) {
      Swal.fire({
        title: "Success!",
        text: "Your example has been saved.",
        icon: "success",
        confirmButtonText: "Ok",
      });
    } else {
      Swal.fire({
        title: "Error!",
        text: "Something went wrong. Please try again.",
        icon: "error",
        confirmButtonText: "Ok",
      });
    }

    setShowExtraInfo(false);
  };

  return (
    <div className="flex flex-col items-center justify-center max-w-md">
      <Modal
        show={showExtraInfo}
        onHide={() => setShowExtraInfo(false)}
        size="xl"
      >
        <Modal.Header
          closeButton
          onHide={() => setShowExtraInfo(false)}
          className="flex justify-end"
        >
          <Modal.Title className="flex justify-end px-16 text-2xl font-bold">
            Explanation
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-16">
          <h5 className="pb-6 text-lg">
            Your prefer output is the answer of the model <strong></strong>
            {bestAnswer.model_letter}:
            <br />
            <br />
            <span className="font-italic">"{bestAnswer.text}"</span>
            <br />
            <br />
            What do you like and dislike about the answer?
          </h5>
          <textarea
            className="w-full p-3 rounded-1 thick-border
            h-72 bg-[#f0f2f5] "
            placeholder="Write your explanation here..."
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
          />
          <div className="flex justify-end col-span-3 gap-8" id="submit">
            <Button
              variant="primary"
              className="max-w-xs my-4 submit-btn button-ellipse text-uppercase"
              onClick={saveExplanation}
            >
              Save
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ExtraInfoChatbot;
