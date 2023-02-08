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
import {
  Container,
  Col,
  Row,
  Card,
  Form,
  Nav,
  OverlayTrigger,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { Avatar } from "../components/Avatar/Avatar";
import "./Sidebar-Layout.css";
import UserContext from "./UserContext";
import BadgeGrid from "./BadgeGrid";
import {
  METooltip,
  RetractionTooltip,
  RejectionTooltip,
} from "./UserStatTooltips";
import ModelSubPage from "../components/ProfilePageComponents/ModelSubPage";

class UserPage extends React.Component {
  static contextType = UserContext;
  constructor(props) {
    super(props);
    this.state = {
      userId: this.props.match.params.userId,
      user: {},
      pageLimit: 10,
    };
  }

  componentDidMount() {
    if (!this.context.api.loggedIn()) {
      this.props.history.push(
        "/login?msg=" +
          encodeURIComponent("Please login first.") +
          `&src=/users/${this.props.match.params.userId}#profile`
      );
    } else {
      if (this.props.location.hash === "") {
        this.props.location.hash = "#profile";
      }

      if (this.props.location.hash === "#profile") {
        this.fetchUser();
      }
    }
  }

  fetchUser = () => {
    this.context.api.getUser(this.state.userId, true).then(
      (result) => {
        this.setState({ user: result });
      },
      (error) => {
        console.log(error);
        if (error.status_code === 404 || error.status_code === 405) {
          this.props.history.push("/");
        }
      }
    );
  };

  getInitial = (name) => {
    return (
      name &&
      name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    );
  };

  componentDidUpdate(prevProps) {
    if (prevProps.location.hash !== this.props.location.hash) {
      this.setState(
        {
          user: {},
        },
        () => {
          if (this.props.location.hash === "#profile") {
            this.fetchUser();
          }
        }
      );
    }
  }

  render() {
    const pageHash = this.props.location.hash;
    return (
      <Container fluid>
        <Row>
          <Col lg={2} className="p-0 border">
            <Nav className="flex-lg-column sidebar-wrapper sticky-top">
              <Nav.Item>
                <Nav.Link
                  href="#profile"
                  className={`gray-color p-3 px-lg-5 ${
                    pageHash === "#profile" ? "active" : ""
                  }`}
                >
                  Profile
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  href="#models"
                  className={`gray-color p-3 px-lg-5 ${
                    pageHash === "#models" ? "active" : ""
                  }`}
                >
                  Models
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>
          <Col>
            <Container>
              {pageHash === "#profile" ? (
                <>
                  <h1 className="my-4 pt-3 text-uppercase text-center">
                    User Overview
                  </h1>
                  <Col className="m-auto" lg={12}>
                    {this.state.user.id && (
                      <>
                        <Card>
                          <Container className="mt-3">
                            <Row>
                              <Col>
                                <Avatar
                                  avatar_url={this.state.user.avatar_url}
                                  username={this.state.user.username}
                                  theme="blue"
                                />
                              </Col>
                            </Row>
                          </Container>
                          <Card.Body>
                            <Form.Group as={Row}>
                              <Form.Label
                                className="text-xl"
                                column
                                sm="6"
                                className="text-right"
                              >
                                Username:
                              </Form.Label>
                              <Col sm="4">
                                <Form.Control
                                  plaintext
                                  readOnly
                                  className="text-right"
                                  defaultValue={this.state.user.username}
                                />
                              </Col>
                            </Form.Group>
                            <Form.Group as={Row}>
                              <Form.Label
                                className="text-xl"
                                column
                                sm="6"
                                className="text-right"
                              >
                                Affiliation:
                              </Form.Label>
                              <Col sm="4">
                                <Form.Control
                                  plaintext
                                  readOnly
                                  className="text-right"
                                  defaultValue={this.state.user.affiliation}
                                />
                              </Col>
                            </Form.Group>
                            <Form.Group as={Row}>
                              <Form.Label
                                className="text-xl"
                                column
                                sm="6"
                                className="text-right"
                              >
                                Model error rate (verified/unverified):
                              </Form.Label>
                              <Col sm="4">
                                <OverlayTrigger
                                  placement="right"
                                  delay={{ show: 250, hide: 400 }}
                                  overlay={METooltip}
                                >
                                  <Form.Control
                                    plaintext
                                    readOnly
                                    className="text-right"
                                    style={{ cursor: "pointer" }}
                                    defaultValue={
                                      this.state.user.examples_submitted > 0
                                        ? (
                                            (100 *
                                              (this.state.user.total_fooled -
                                                this.state.user
                                                  .total_verified_not_correct_fooled)) /
                                            this.state.user.examples_submitted
                                          )
                                            .toFixed(2)
                                            .toString() +
                                          "% (" +
                                          (
                                            this.state.user.total_fooled -
                                            this.state.user
                                              .total_verified_not_correct_fooled
                                          ).toString() +
                                          "/" +
                                          this.state.user.examples_submitted +
                                          ") / " +
                                          (
                                            (100 *
                                              this.state.user.total_fooled) /
                                            this.state.user.examples_submitted
                                          )
                                            .toFixed(2)
                                            .toString() +
                                          "% (" +
                                          this.state.user.total_fooled.toString() +
                                          "/" +
                                          this.state.user.examples_submitted +
                                          ")"
                                        : "N/A"
                                    }
                                  />
                                </OverlayTrigger>
                              </Col>
                            </Form.Group>
                            <Form.Group as={Row}>
                              <Form.Label
                                className="text-xl"
                                column
                                sm="6"
                                className="text-right"
                              >
                                Rejection rate:
                              </Form.Label>
                              <Col sm="4">
                                <OverlayTrigger
                                  placement="right"
                                  delay={{ show: 250, hide: 400 }}
                                  overlay={RejectionTooltip}
                                >
                                  <Form.Control
                                    plaintext
                                    readOnly
                                    className="text-right"
                                    style={{ cursor: "pointer" }}
                                    defaultValue={
                                      this.state.user.examples_submitted > 0
                                        ? (
                                            (100 *
                                              this.state.user
                                                .total_verified_not_correct_fooled) /
                                            this.state.user.examples_submitted
                                          )
                                            .toFixed(2)
                                            .toString() +
                                          "% (" +
                                          this.state.user.total_verified_not_correct_fooled.toString() +
                                          "/" +
                                          this.state.user.examples_submitted +
                                          ")"
                                        : "N/A"
                                    }
                                  />
                                </OverlayTrigger>
                              </Col>
                            </Form.Group>
                            <Form.Group as={Row}>
                              <Form.Label
                                className="text-xl"
                                column
                                sm="6"
                                className="text-right"
                              >
                                Retraction rate:
                              </Form.Label>
                              <Col sm="4">
                                <OverlayTrigger
                                  placement="right"
                                  delay={{ show: 250, hide: 400 }}
                                  overlay={RetractionTooltip}
                                >
                                  <Form.Control
                                    plaintext
                                    readOnly
                                    className="text-right"
                                    style={{ cursor: "pointer" }}
                                    defaultValue={
                                      this.state.user.examples_submitted > 0
                                        ? (
                                            (100 *
                                              this.state.user.total_retracted) /
                                            this.state.user.examples_submitted
                                          )
                                            .toFixed(2)
                                            .toString() +
                                          "% (" +
                                          this.state.user.total_retracted.toString() +
                                          "/" +
                                          this.state.user.examples_submitted +
                                          ")"
                                        : "N/A"
                                    }
                                  />
                                </OverlayTrigger>
                              </Col>
                            </Form.Group>
                          </Card.Body>
                          {this.state.user.id === this.context.user.id && (
                            <Card.Footer>
                              <Row>
                                <Col className="text-center">
                                  <Link className="" to="/account#profile">
                                    Looking for your profile?
                                  </Link>
                                </Col>
                              </Row>
                            </Card.Footer>
                          )}
                        </Card>
                        <BadgeGrid user={this.state.user} />
                      </>
                    )}
                  </Col>
                </>
              ) : null}
              {pageHash === "#models" ? (
                <ModelSubPage
                  api={this.context.api}
                  userId={this.state.userId}
                  pageLimit={this.state.pageLimit}
                  history={this.props.history}
                  pageTitle={"User Models"}
                  isSelfModelsTable={false}
                />
              ) : null}
            </Container>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default UserPage;
