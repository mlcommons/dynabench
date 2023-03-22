import ShowInstructionsButton from "new_front/components/Buttons/ShowInstructionsButton";
import React, { FC } from "react";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";

type TaskHelpersButtonProps = {
  adminOrOwner: boolean;
  taskCode: string;
};

const TaskHelpersButton: FC<TaskHelpersButtonProps> = ({
  adminOrOwner,
  taskCode,
}) => {
  return (
    <div>
      <ShowInstructionsButton color="white" />
      {adminOrOwner && (
        <Button
          as={Link}
          to={`/task-owner-interface/${taskCode}#settings`}
          type="button"
          className="text-white border-white btn btn-light btn-outline-primary btn-sm btn-help-info "
        >
          <i className="fas fa-cog"></i>
        </Button>
      )}
    </div>
  );
};

export default TaskHelpersButton;
