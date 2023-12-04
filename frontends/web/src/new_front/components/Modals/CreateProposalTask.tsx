import React, { FC, useContext, useEffect } from "react";
import { Button } from "react-bootstrap";
import Form from "react-bootstrap/Form";
import { useForm } from "react-hook-form";
import Modal from "react-bootstrap/Modal";
import useFetch from "use-http";
import Swal from "sweetalert2";
import UserContext from "containers/UserContext";
import { useHistory } from "react-router-dom";
import { checkUserIsLoggedIn } from "new_front/utils/helpers/functions/LoginFunctions";

type CreateProposalTaskProps = {
  handleClose: () => void;
};

const CreateProposalTask: FC<CreateProposalTaskProps> = ({ handleClose }) => {
  const { user } = useContext(UserContext);
  const history = useHistory();
  const { get, post, response } = useFetch();
  const initState = {
    nameChallenge: "",
    taskCode: "",
    shortDescription: "",
    description: "",
  };

  const { register, handleSubmit } = useForm({
    mode: "onTouched",
    reValidateMode: "onSubmit",
    defaultValues: initState,
  });

  const onSubmit = async (data: any) => {
    if (!user) {
      return;
    }
    const isValid = await get(
      `task_proposals/validate_no_duplicate_task_name/${data.nameChallenge}`,
    );
    if (isValid) {
      await post("task_proposals/add_task_proposal", {
        user_id: user.id,
        task_code: data.taskCode,
        name: data.nameChallenge,
        desc: data.shortDescription,
        longdesc: data.description,
      });
      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Your task proposal has been submitted",
          confirmButtonText: "Ok",
        });
        handleClose();
      }
    } else {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "This task name already exists",
      });
    }
  };

  const isLogin = async () => {
    if (!user.id) {
      await checkUserIsLoggedIn(history, `/`, null, null);
    }
  };

  useEffect(() => {
    isLogin();
  }, [user]);

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <Modal.Header closeButton>
        <Modal.Title className="text-2xl font-bold text-letter-color">
          Propose new task
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3" controlId="nameTask">
          <Form.Label className="text-lg font-bold text-letter-color">
            Challenge name
          </Form.Label>
          <Form.Control
            placeholder="Task name"
            autoFocus
            {...register("nameChallenge", { required: true })}
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="shortDescription">
          <Form.Label className="text-lg font-bold text-letter-color">
            Short description
          </Form.Label>
          <Form.Control
            placeholder="Short description"
            autoFocus
            {...register("shortDescription", { required: true })}
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="description">
          <Form.Label className="text-lg font-bold text-letter-color">
            Description
          </Form.Label>
          <Form.Control
            placeholder="Description"
            autoFocus
            {...register("description", { required: true })}
            as="textarea"
            className="h-32"
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="primary"
          onClick={handleClose}
          className="border-0 font-weight-bold light-gray-bg"
        >
          Close
        </Button>
        <Button
          variant="primary"
          type="submit"
          className="border-0 font-weight-bold light-gray-bg"
        >
          Submit proposal
        </Button>
      </Modal.Footer>
    </Form>
  );
};

export default CreateProposalTask;
