/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import { Card, Col } from "react-bootstrap";
import { LineRechart } from "../../components/Charts/Rechart";
import { chartSizesLineRechart } from "./chartSizes";

const TaskTrend = ({ trendScore }) => {
  return (
    <>
      <Card className="my-4">
        <Card.Header className="p-3 light-gray-bg">
          <h2 className="m-0 text-uppercase text-reset">
            Model Performance vs. Round{" "}
          </h2>
        </Card.Header>
        <Card.Body className="px-1 py-5">
          {/* Mobile / Tablet / Desktop charts */}
          <Col xs={12} className="d-block d-sm-none">
            <LineRechart size={chartSizesLineRechart.xs} data={trendScore} />
          </Col>
          <Col sm={12} className="d-none d-sm-block d-md-none">
            <LineRechart size={chartSizesLineRechart.sm} data={trendScore} />
          </Col>
          <Col md={12} className="d-none d-md-block d-lg-none">
            <LineRechart size={chartSizesLineRechart.md} data={trendScore} />
          </Col>
          <Col lg={12} className="d-none d-lg-block d-xl-none">
            <LineRechart size={chartSizesLineRechart.lg} data={trendScore} />
          </Col>
          <Col xl={12} className="d-none d-xl-block">
            <LineRechart size={chartSizesLineRechart.xl} data={trendScore} />
          </Col>
        </Card.Body>
      </Card>
    </>
  );
};

export default TaskTrend;
