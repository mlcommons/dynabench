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
import { Card } from "react-bootstrap";
import "./BadgeGrid.css";
import Badge from "./Badge";

const BadgeGrid = (props) => {
  return (
    <Card style={{ marginTop: 10, padding: 50, textAlign: "center" }}>
      {props.user.badges ? (
        <div className="image-grid-container">
          {props.user.badges.map(({ name, awarded }, idx) => (
            <center key={idx}>
              <Badge name={name} awarded={awarded} />
            </center>
          ))}
        </div>
      ) : (
        "No badges yet"
      )}
    </Card>
  );
};

export default BadgeGrid;
