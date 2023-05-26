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

import React, { useContext, useEffect, useState } from "react";
import UserContext from "../../containers/UserContext";
import {
  Card,
  Dropdown,
  DropdownButton,
  OverlayTrigger,
  Pagination,
  Table,
  Tooltip,
} from "react-bootstrap";
import { Annotation } from "../../containers/Overlay";
import { Avatar } from "../Avatar/Avatar";
import { Link } from "react-router-dom";

const UserLeaderboardCard = (props) => {
  const context = useContext(UserContext);
  const [pageLimit] = useState(7);
  const [isEndOfUserLeaderPage, setIsEndOfUserLeaderPage] = useState(true);
  const [userLeaderBoardData, setUserLeaderBoardData] = useState([]);
  const [displayRound, setDisplayRound] = useState("overall");
  const [userLeaderBoardPage, setUserLeaderBoardPage] = useState(0);

  useEffect(() => {
    setIsEndOfUserLeaderPage(true);
    setUserLeaderBoardData([]);
    setDisplayRound("overall");
    setUserLeaderBoardPage(0);
  }, [props.taskId]);

  useEffect(() => {
    const fetchOverallUserLeaderboard = () => {
      context.api
        .getOverallUserLeaderboard(
          props.taskId,
          displayRound,
          pageLimit,
          userLeaderBoardPage
        )
        .then(
          (result) => {
            const isEndOfPage =
              (userLeaderBoardPage + 1) * pageLimit >= result.count;
            setIsEndOfUserLeaderPage(isEndOfPage);
            setUserLeaderBoardData(result.data);
            setUserLeaderBoardPage(userLeaderBoardPage);
          },
          (error) => {
            console.log(error);
          }
        );
    };

    fetchOverallUserLeaderboard();
    return () => {};
  }, [displayRound, pageLimit, userLeaderBoardPage, context.api, props.taskId]);

  const rounds = (props.round && props.cur_round) || 0;
  const roundNavs = [];
  for (let i = rounds; i >= 0; i--) {
    let cur = "";
    let active = false;
    if (i === props.cur_round) {
      cur = " (active)";
    }
    const dropDownRound = i === 0 ? "overall" : i;
    if (dropDownRound === displayRound) {
      active = true;
    }
    roundNavs.push(
      <Dropdown.Item
        key={dropDownRound}
        index={dropDownRound}
        onClick={() => setDisplayRound(dropDownRound)}
        active={active}
      >
        {dropDownRound === "overall" ? "Overall" : "Round " + dropDownRound}
        {cur}
      </Dropdown.Item>
    );
    if (i === props.cur_round) {
      roundNavs.push(<Dropdown.Divider key={"div" + i} />);
    }
  }
  return (
    <Annotation
      placement="left"
      tooltip="This shows how well our users did on this task. This does not include non-Dynabench users such as Mechanical Turkers."
    >
      <Card className="my-4">
        <Card.Header className="light-gray-bg d-flex align-items-center">
          <h2 className="m-0 text-uppercase text-reset">Example Leaderboard</h2>
          <div className="d-flex justify-content-end flex-fill">
            <OverlayTrigger
              placement="top"
              overlay={
                <Tooltip id="tip-user-round-selection">Switch Round</Tooltip>
              }
            >
              <DropdownButton
                variant="light"
                className="border-0 font-weight-bold light-gray-bg"
                style={{ marginRight: 10 }}
                id="dropdown-basic-button"
                title={
                  displayRound === "overall"
                    ? "Overall"
                    : "Round " +
                      displayRound +
                      (props.cur_round === displayRound ? " (active)" : "")
                }
              >
                {roundNavs}
              </DropdownButton>
            </OverlayTrigger>
          </div>
        </Card.Header>
        <Table hover className="mb-0">
          <thead>
            <tr>
              <th>User</th>
              {props.dataValidation ? (
                <th className="text-right">MER</th>
              ) : null}
              <th className="pr-4 text-right">Totals</th>
            </tr>
          </thead>
          <tbody>
            {userLeaderBoardData.map((data) => {
              return (
                <tr key={data.uid}>
                  <td>
                    <Avatar
                      avatar_url={data.avatar_url}
                      username={data.username}
                      isThumbnail={true}
                      theme="blue"
                    />
                    <Link
                      to={`/users/${data.uid}#profile`}
                      className="btn-link"
                    >
                      {data.username}
                    </Link>
                  </td>
                  {props.dataValidation ? (
                    <td className="text-right">{data.MER}%</td>
                  ) : null}
                  {props.dataValidation ? (
                    <td className="pr-4 text-right">{data.total}</td>
                  ) : (
                    <td className="pr-4 text-right">{data.created}</td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </Table>
        <Card.Footer className="text-center">
          <Pagination className="float-right mb-0" size="sm">
            <Pagination.Item
              disabled={!userLeaderBoardPage}
              onClick={() => setUserLeaderBoardPage(userLeaderBoardPage - 1)}
            >
              Previous
            </Pagination.Item>
            <Pagination.Item
              disabled={isEndOfUserLeaderPage}
              onClick={() => setUserLeaderBoardPage(userLeaderBoardPage + 1)}
            >
              Next
            </Pagination.Item>
          </Pagination>
        </Card.Footer>
      </Card>
    </Annotation>
  );
};

export default UserLeaderboardCard;
