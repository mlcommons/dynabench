/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import Moment from "react-moment";

const Badge = ({ name, awarded }) => {
  var desc = "Unknown badge";
  switch (name) {
    case "ALL_TASKS_COVERED":
      desc = "All tasks covered!";
      break;
    case "DYNABENCH_BRONZE":
      desc = "Dynabench bronze!";
      break;
    case "DYNABENCH_GOLD":
      desc = "Dynabench gold!";
      break;
    case "DYNABENCH_SILVER":
      desc = "Dynabench silver!";
      break;
    case "DYNABENCH_PLATINUM":
      desc = "Dynabench platinum!";
      break;
    case "DYNABENCH_DIAMOND":
      desc = "Dynabench diamond!";
      break;
    case "DYNABENCH_HS_BRONZE":
      desc = "Dynabench hate speech bronze!";
      break;
    case "DYNABENCH_HS_GOLD":
      desc = "Dynabench hate speech gold!";
      break;
    case "DYNABENCH_HS_SILVER":
      desc = "Dynabench hate speech silver!";
      break;
    case "DYNABENCH_HS_PLATINUM":
      desc = "Dynabench hate speech platinum!";
      break;
    case "DYNABENCH_HS_DIAMOND":
      desc = "Dynabench hate speech platinum!";
      break;
    case "DYNABENCH_NLI_BRONZE":
      desc = "Dynabench natrual language inference bronze!";
      break;
    case "DYNABENCH_NLI_GOLD":
      desc = "Dynabench natrual language inference gold!";
      break;
    case "DYNABENCH_NLI_SILVER":
      desc = "Dynabench natrual language inference silver!";
      break;
    case "DYNABENCH_NLI_PLATINUM":
      desc = "Dynabench natrual language inference platinum!";
      break;
    case "DYNABENCH_NLI_DIAMOND":
      desc = "Dynabench natrual language inference diamond!";
      break;
    case "DYNABENCH_QA_BRONZE":
      desc = "Dynabench question answering bronze!";
      break;
    case "DYNABENCH_QA_GOLD":
      desc = "Dynabench question answering gold!";
      break;
    case "DYNABENCH_QA_SILVER":
      desc = "Dynabench question answering silver!";
      break;
    case "DYNABENCH_QA_PLATINUM":
      desc = "Dynabench question answering platinum!";
      break;
    case "DYNABENCH_QA_DIAMOND":
      desc = "Dynabench question answering diamond!";
      break;
    case "DYNABENCH_SENT_BRONZE":
      desc = "Dynabench sentiment analysis bronze!";
      break;
    case "DYNABENCH_SENT_GOLD":
      desc = "Dynabench sentiment analysis gold!";
      break;
    case "DYNABENCH_SENT_SILVER":
      desc = "Dynabench sentiment analysis silver!";
      break;
    case "DYNABENCH_SENT_PLATINUM":
      desc = "Dynabench sentiment analysis platinum!";
      break;
    case "DYNABENCH_SENT_DIAMOND":
      desc = "Dynabench sentiment analysis diamond!";
      break;
    case "TESTING_BADGES":
      desc = "Test badge!";
      break;
    case "WELCOME_NOOB":
      desc = "Welcome noob!";
      break;
    case "FIRST_CREATED":
      desc = "First example!";
      break;
    case "FIRST_STEPS":
      desc = "First steps!";
      break;
    case "FIRST_VALIDATED_FOOLING":
      desc = "First time fooled!";
      break;
    case "FIRST_VERIFIED":
      desc = "First validation!";
      break;
    case "FIRST_TEN_CREATED":
      desc = "First ten examples!";
      break;
    case "MODEL_BUILDER":
      desc = "Model builder!";
      break;
    case "SOTA":
      desc = "State of the art!";
      break;
    case "SERIAL_PREDICTOR":
      desc = "Serial predictor!";
      break;
    case "MULTITASKER":
      desc = "Multi tasker!";
      break;
    case "EXAMPLE_STREAK_5":
      desc = "Five example streak!";
      break;
    case "EXAMPLE_STREAK_10":
      desc = "Ten example streak!";
      break;
    case "EXAMPLE_STREAK_20":
      desc = "Twenty example streak!";
      break;
    case "EXAMPLE_STREAK_50":
      desc = "Fifty example streak!";
      break;
    case "EXAMPLE_STREAK_100":
      desc = "Hundred example streak!";
      break;
    case "DAY_STREAK_2":
      desc = "Two day streak!";
      break;
    case "DAY_STREAK_3":
      desc = "Three day streak!";
      break;
    case "DAY_STREAK_5":
      desc = "Five day streak!";
      break;
    case "DAY_STREAK_1_WEEK":
      desc = "One week streak!";
      break;
    case "DAY_STREAK_2_WEEK":
      desc = "Two week streak!";
      break;
    case "DAY_STREAK_1_MONTH":
      desc = "One month streak!";
      break;
    case "DAY_STREAK_3_MONTH":
      desc = "Three month streak!";
      break;
    case "DAY_STREAK_1_YEAR":
      desc = "One year streak!";
      break;
    case "WEEKLY_WINNER":
      desc = "Most examples created weekly winner!";
      break;
    default:
      break;
  }

  return (
    <OverlayTrigger
      placement="top"
      delay={{ show: 250, hide: 400 }}
      overlay={(props) => (
        <Tooltip {...props}>
          {desc}
          <br />
          Awarded{" "}
          <Moment utc fromNow>
            {awarded}
          </Moment>
        </Tooltip>
      )}
    >
      <>
        <img
          src={"/badges/" + name + ".png"}
          style={{ width: 50, marginBottom: 10 }}
          alt="badge"
        />
        <p className="text-center text-letter-color ">{desc}</p>
      </>
    </OverlayTrigger>
  );
};

export default Badge;
