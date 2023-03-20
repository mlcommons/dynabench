import React, { FC } from "react";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";

type TaskHelpersButtonProps = {
  adminOrOwner: boolean;
  taskCode: string;
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
};

const TaskHelpersButton: FC<TaskHelpersButtonProps> = ({
  adminOrOwner,
  taskCode,
  hidden,
  setHidden,
}) => {
  return (
    <div>
      <button
        type="button"
        className="btn btn-outline-primary btn-sm btn-help-info text-white border-white	mr-1"
        onClick={() => {
          setHidden(!hidden);
        }}
      >
        <i className="fas fa-question"></i>
      </button>
      {adminOrOwner && (
        <Button
          as={Link}
          to={`/task-owner-interface/${taskCode}#settings`}
          type="button"
          className="btn btn-light btn-outline-primary btn-sm btn-help-info text-white border-white	"
        >
          <i className="fas fa-cog"></i>
        </Button>
      )}
    </div>
  );
};

export default TaskHelpersButton;
