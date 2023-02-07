/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, { FC } from "react";
import Moment from "react-moment";
import { Table } from "react-bootstrap";
import { OverallTaskStatsProps } from "../../types/task/overallTaskStats";

const OverallTaskStats: FC<OverallTaskStatsProps> = ({
  curRound,
  round,
  lastUpdated,
}) => {
  return (
    <Table className="w-50 font-weight-bold ml-n2">
      <thead />
      <tbody>
        <tr>
          <td>Current round:</td>
          <td className="text-right">{curRound}</td>
        </tr>
        <tr>
          <td>Fooled/Collected (Model Error rate)</td>
          <td className="text-right">
            {round?.total_fooled}/{round?.total_collected} (
            {round?.total_collected > 0
              ? ((100 * round?.total_fooled) / round?.total_collected).toFixed(
                  2
                )
              : "0.00"}
            % )
          </td>
        </tr>
        {round && (
          <tr>
            <td>Verified Fooled/Collected (Verified Model Error Rate)</td>
            <td className="text-right">
              {round?.total_verified_fooled}/{round?.total_collected} (
              {round?.total_collected > 0
                ? (
                    (100 * round?.total_verified_fooled) /
                    round?.total_collected
                  ).toFixed(2)
                : "0.00"}
              % )
            </td>
          </tr>
        )}
        <tr>
          <td>Last activity:</td>
          <td className="text-right">
            <Moment utc fromNow>
              {lastUpdated}
            </Moment>
          </td>
        </tr>
      </tbody>
    </Table>
  );
};

export default OverallTaskStats;
