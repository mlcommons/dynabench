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

import React, { useEffect, useCallback, useState } from "react";
import {
  Card,
  Col,
  Container,
  Pagination,
  Table,
  Modal,
  Button,
  Form,
  Row,
} from "react-bootstrap";
import { Formik } from "formik";

const TaskProposalForm = (props) => {
  const { handleProposalSubmit, getPage } = props;

  const [showCreateModal, setShowCreateModal] = useState(false);
  return (
    <>
      <Modal
        size="lg"
        show={showCreateModal}
        onHide={() => setShowCreateModal(!showCreateModal)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Propose new task</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Formik
            initialValues={{
              desc: "",
              longdesc: "",
              name: "",
              task_code: "",
            }}
            onSubmit={(values, args) =>
              handleProposalSubmit(values, args, () => {
                getPage();
                setShowCreateModal(!showCreateModal);
              })
            }
          >
            {({
              values,
              errors,
              handleChange,
              handleSubmit,
              isSubmitting,
              dirty,
            }) => (
              <>
                <form className="px-4" onSubmit={handleSubmit}>
                  <Container>
                    <Form.Group
                      as={Row}
                      controlId="name"
                      className="py-3 my-0 border-bottom"
                    >
                      <Form.Label column>
                        <b>Name</b>
                      </Form.Label>
                      <Col sm="8">
                        <Form.Control
                          onChange={handleChange}
                          defaultValue={values.name}
                        />
                      </Col>
                    </Form.Group>
                    <Form.Group
                      as={Row}
                      controlId="task_code"
                      className="py-3 my-0 border-bottom"
                    >
                      <Form.Label column>
                        <b>Task Code</b>
                      </Form.Label>
                      <Col sm="8">
                        <Form.Control
                          onChange={handleChange}
                          defaultValue={values.task_code}
                        />
                        <Form.Text id="taskCodeHelpBlock" muted>
                          This is a short string that will be the url for your
                          task. e.g "nli" for "Natural Language Inference"
                        </Form.Text>
                      </Col>
                    </Form.Group>
                    <Form.Group
                      as={Row}
                      controlId="desc"
                      className="py-3 my-0 border-bottom"
                    >
                      <Form.Label column>
                        <b>Short Description</b>
                      </Form.Label>
                      <Col sm="8">
                        <Form.Control
                          onChange={handleChange}
                          defaultValue={values.desc}
                        />
                      </Col>
                    </Form.Group>
                    <Form.Group
                      as={Row}
                      controlId="longdesc"
                      className="py-3 my-0"
                    >
                      <Form.Label column>
                        <b>Long Description</b>
                      </Form.Label>
                      <Col sm="8">
                        <Form.Control
                          rows={12}
                          as="textarea"
                          onChange={handleChange}
                          defaultValue={values.longdesc}
                        />
                      </Col>
                    </Form.Group>
                    <Form.Group as={Row} className="py-3 my-0">
                      <Col sm="8">
                        <small className="form-text text-muted">
                          {errors.accept}
                        </small>
                      </Col>
                    </Form.Group>
                    <Row className="justify-content-md-center">
                      <Col md={5} sm={12}>
                        {dirty &&
                        values.name &&
                        values.desc &&
                        values.task_code &&
                        values.longdesc ? (
                          <Button
                            type="submit"
                            variant="primary"
                            className="submit-btn button-ellipse text-uppercase my-4"
                            disabled={isSubmitting}
                          >
                            Submit
                          </Button>
                        ) : null}
                      </Col>
                    </Row>
                  </Container>
                </form>
              </>
            )}
          </Formik>
        </Modal.Body>
      </Modal>

      <Row>
        <Col className="text-center">
          <center>
            <Button
              variant="primary"
              onClick={() => setShowCreateModal(!showCreateModal)}
              style={{ marginBottom: "10px" }}
            >
              <i className="fas fa-edit"></i> Propose new task
            </Button>
          </center>
        </Col>
      </Row>
    </>
  );
};

const TaskProposalTable = (props) => {
  const { data, page, paginate, isEndOfPage } = props;

  const [showViewModals, setShowViewModals] = useState(
    data.map((datum) => false)
  );

  if (data.length !== showViewModals.length) {
    setShowViewModals(data.map((datum) => false));
  }

  return (
    <Col className="m-auto" lg={12}>
      <Card className="profile-card">
        <Card.Body className="overflow-auto">
          <Table hover className="mb-0">
            <thead className="principal-color border-bottom">
              <tr>
                <td>
                  <b>Name</b>
                </td>
                <td>
                  <b>Code</b>
                </td>
                <td>
                  <b>TLDR</b>
                </td>
                <td>
                  <b>Description</b>
                </td>
              </tr>
            </thead>
            <tbody>
              {!data.length ? (
                <tr>
                  <td colSpan="4">
                    <div className="text-center">No data found</div>
                  </td>
                </tr>
              ) : null}
              {data.map((datum, index) => {
                return (
                  <tr key={index}>
                    <Modal
                      size="lg"
                      show={showViewModals[index]}
                      onHide={() =>
                        setShowViewModals(
                          showViewModals.map((obj, obj_index) =>
                            index === obj_index ? !obj : obj
                          )
                        )
                      }
                    >
                      <Modal.Header closeButton>
                        <Modal.Title>View Proposal</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        <Container>
                          <Form.Group
                            as={Row}
                            className="py-3 my-0 border-bottom"
                          >
                            <Form.Label column>
                              <b>Name</b>
                            </Form.Label>
                            <Col sm="8">
                              <Form.Control disabled value={datum.name} />
                            </Col>
                          </Form.Group>
                          <Form.Group
                            as={Row}
                            className="py-3 my-0 border-bottom"
                          >
                            <Form.Label column>
                              <b>Task Code</b>
                            </Form.Label>
                            <Col sm="8">
                              <Form.Control disabled value={datum.task_code} />
                            </Col>
                          </Form.Group>
                          <Form.Group
                            as={Row}
                            className="py-3 my-0 border-bottom"
                          >
                            <Form.Label column>
                              <b>Short Description</b>
                            </Form.Label>
                            <Col sm="8">
                              <Form.Control disabled value={datum.desc} />
                            </Col>
                          </Form.Group>
                          <Form.Group as={Row} className="py-3 my-0">
                            <Form.Label column>
                              <b>Long Description</b>
                            </Form.Label>
                            <Col sm="8">
                              <Form.Control
                                disabled
                                rows={12}
                                as="textarea"
                                value={datum.longdesc}
                              />
                            </Col>
                          </Form.Group>
                        </Container>
                      </Modal.Body>
                    </Modal>
                    <td className="text-truncate long-text">
                      <span
                        className="btn-link dataset-link"
                        onClick={() =>
                          setShowViewModals(
                            showViewModals.map((obj, obj_index) =>
                              index === obj_index ? !obj : obj
                            )
                          )
                        }
                      >
                        {datum.name}
                      </span>
                    </td>
                    <td>{datum.task_code}</td>
                    <td className="text-truncate long-text">
                      <span>{datum.desc}</span>
                    </td>
                    <td className="text-truncate long-text">
                      <span>{datum.longdesc}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </Card.Body>
        <Card.Footer className="text-center">
          <Pagination className="mb-0 float-right" size="sm">
            <Pagination.Item disabled={!page} onClick={() => paginate("prev")}>
              Previous
            </Pagination.Item>
            <Pagination.Item
              disabled={isEndOfPage}
              onClick={() => paginate("next")}
            >
              Next
            </Pagination.Item>
          </Pagination>
        </Card.Footer>
      </Card>
    </Col>
  );
};

const TaskProposalSubPage = (props) => {
  const [userTaskProposals, setUserTaskProposals] = useState([]);
  const [taskProposalsPage, setTaskProposalsPage] = useState(0);
  const [isEndOfTaskProposalsPage, setIsEndOfTaskProposalsPage] =
    useState(true);

  const { api, handleProposalSubmit } = props;
  const pageLimit = 5;

  const getPage = useCallback(() => {
    api.getUserTaskProposals(taskProposalsPage, pageLimit).then(
      (result) => {
        const isEndOfPage =
          (taskProposalsPage + 1) * pageLimit >= (result.count || 0);
        setIsEndOfTaskProposalsPage(isEndOfPage);
        setUserTaskProposals(result.data || []);
      },
      (error) => {
        console.log(error);
      }
    );
  }, [api, taskProposalsPage]);

  useEffect(() => {
    getPage();
  }, [getPage]);

  const paginate = (state) => {
    const is_next = state === "next";
    const newPage = is_next ? taskProposalsPage + 1 : taskProposalsPage - 1;
    setTaskProposalsPage(newPage);
  };

  return (
    <>
      <TaskProposalForm
        getPage={getPage}
        handleProposalSubmit={handleProposalSubmit}
      />
      {userTaskProposals.length !== 0 && (
        <Container className="mb-5 pb-5">
          <h1 className="my-4 pt-3 text-uppercase text-center">
            Your Proposals
          </h1>
          <TaskProposalTable
            data={userTaskProposals}
            page={taskProposalsPage}
            getPage={getPage}
            paginate={paginate}
            isEndOfPage={isEndOfTaskProposalsPage}
          />
        </Container>
      )}
    </>
  );
};

export default TaskProposalSubPage;
