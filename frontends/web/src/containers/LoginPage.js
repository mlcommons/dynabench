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
import { Formik } from "formik";
import { Container, Row, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import "./LoginPage.css";
import UserContext from "./UserContext";

import qs from "qs";

class LoginPage extends React.Component {
  construct() {}
  render() {
    var query = qs.parse(this.props.location.search, {
      ignoreQueryPrefix: true,
    });
    return (
      <UserContext.Consumer>
        {(props) => (
          <Container>
            <Row>
              <div className="wrapper fade-in-down">
                <div id="form-content" className="login-form text-center">
                  <h2 className="d-block my-4 text-uppercase text-reset">
                    Log In
                  </h2>
                  <p className="msg mb-0">{query.msg}</p>
                  <hr className="mb-4" />
                  <Formik
                    initialValues={{
                      email: "",
                      password: "",
                      src: query.src ? query.src : "/",
                    }}
                    validate={(values) => {
                      const errors = {};
                      if (!values.email) {
                        errors.email = "Required";
                      }
                      return errors;
                    }}
                    onSubmit={(values, { setFieldError, setSubmitting }) => {
                      props.api.login(values.email, values.password).then(
                        (result) => {
                          //console.log(result);
                          props.updateState({
                            user: {
                              ...props.api.getCredentials(),
                              avatar_url: result.user.avatar_url,
                            },
                          });
                          this.props.history.push(values.src);
                        },
                        (error) => {
                          console.log(error);
                          this.setState({ error });
                          setSubmitting(false);
                          setFieldError("general", "Authentication failed");
                        }
                      );
                    }}
                  >
                    {({
                      values,
                      errors,
                      touched,
                      handleChange,
                      handleBlur,
                      handleSubmit,
                      isSubmitting,
                    }) => (
                      <>
                        <form className="px-4" onSubmit={handleSubmit}>
                          <input
                            type="email"
                            name="email"
                            className="fade-in first text-left"
                            placeholder="Email"
                            onChange={handleChange}
                            onBlur={handleBlur}
                            value={values.email}
                          />
                          <small className="form-text text-muted">
                            {errors.email && touched.email && errors.email}
                          </small>
                          <input
                            type="password"
                            name="password"
                            className="fade-in second text-left"
                            placeholder="Password"
                            onChange={handleChange}
                            onBlur={handleBlur}
                            value={values.password}
                          />
                          <small className="form-text text-muted">
                            {errors.password &&
                              touched.password &&
                              errors.password}
                          </small>
                          <small className="form-text text-muted">
                            {errors.general}
                          </small>
                          <Button
                            type="submit"
                            variant="primary"
                            className="fade-in third submit-btn button-ellipse text-uppercase my-4"
                            disabled={isSubmitting}
                          >
                            Submit
                          </Button>
                        </form>
                        <div className="mb-5">
                          <p>
                            Don't have an account?{" "}
                            <Link className="underline-hover" to="/register">
                              Sign up
                            </Link>
                          </p>
                          <p>
                            <Link
                              className="underline-hover"
                              to="/forgot-password"
                            >
                              Forgot Password?
                            </Link>
                          </p>
                        </div>
                      </>
                    )}
                  </Formik>
                </div>
              </div>
            </Row>
          </Container>
        )}
      </UserContext.Consumer>
    );
  }
}

export default LoginPage;
