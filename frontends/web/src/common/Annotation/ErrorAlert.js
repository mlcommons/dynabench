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
import { Alert } from "react-bootstrap";

class ErrorAlert extends React.Component {
  render() {
    return (
      <Alert variant={"danger"} className="px-2 mx-0" style={{ width: "100%" }}>
        There is a problem with the platform. Please contact{" "}
        <Alert.Link href="mailto:dynabench-site@mlcommons.org">
          dynabench-site@mlcommons.org
        </Alert.Link>
        .
      </Alert>
    );
  }
}

export default ErrorAlert;
