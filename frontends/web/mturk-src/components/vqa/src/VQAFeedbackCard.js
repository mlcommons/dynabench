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
import { Col, Row, Card, FormControl, InputGroup } from "react-bootstrap";

class VQAFeedbackCard extends React.Component {
  constructor(props) {
    super(props);
    this.bottomAnchorFeedbackRef = React.createRef();
  }

  handleKeyPress = (e) => {
    if (e.key.toLowerCase() === "enter") {
      this.props.submitHistory();
    }
  };

  componentDidMount() {
    if (this.bottomAnchorFeedbackRef.current) {
      this.bottomAnchorFeedbackRef.current.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }
  }

  render() {
    return (
      <Card className="d-flex justify-content-center" style={{ width: "100%" }}>
        <Card.Body className="p-3">
          <Row>
            <Col xs={12}>
              <h3 className="text-uppercase dark-principal-color spaced-header">
                Feedback and comments are welcome:
              </h3>
              <InputGroup>
                <FormControl
                  style={{ width: "100%", margin: 2 }}
                  autoFocus
                  type="text"
                  placeholder="Optionally write your comments and press enter to submit..."
                  value={this.props.comments}
                  onChange={(e) => this.props.handleCommentsChange(e)}
                  onKeyPress={this.handleKeyPress}
                />
              </InputGroup>
            </Col>
          </Row>
        </Card.Body>
        <div className="bottom-anchor" ref={this.bottomAnchorFeedbackRef} />
      </Card>
    );
  }
}

export { VQAFeedbackCard };
