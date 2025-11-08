import React, { useState } from "react";
import { ReactComponent as RegisterLogo } from "new_front/assets/register.svg";
import { Button } from "react-bootstrap";
import { Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import Swal from "sweetalert2";
import * as Yup from "yup";
import useFetch from "use-http";
import UserContext from "containers/UserContext";

const Register = () => {
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { post, response } = useFetch();

  const schema = Yup.object().shape({
    username: Yup.string().min(3, "Username must be at least 3 characters"),
    email: Yup.string().email("Invalid email format"),
    password: Yup.string().min(8, "Password must be at least 8 characters"),
  });

  const initialValues = {
    username: "",
    email: "",
    password: "",
  };

  const onSubmit = async (values: any) => {
    setSubmitting(true);
    await post("auth/create_user", {
      email: values.email,
      password: values.password,
      username: values.username,
    });
    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "User created successfully",
      });
      window.location.href = "/";
    } else {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Something went wrong! try another email or username",
      });
    }
    setSubmitting(false);
  };

  const renderError = (message: string) => (
    <p className="help is-danger">{message}</p>
  );

  return (
    <section className="h-screen bg-gradient-to-b from-white to-[#ccebd466]">
      <div className="container h-full p-32">
        <div className="flex flex-wrap items-center justify-center h-full g-6 lg:justify-between">
          <div className="mb-12 md:mb-0 md:w-8/12 lg:w-6/12">
            <RegisterLogo className="hidden w-full h-full md:block" />
          </div>
          <div className="md:w-8/12 lg:ml-6 lg:w-5/12">
            <h1 className="pb-8 mb-6 text-4xl font-bold text-letter-color">
              Welcome to Dynabench!
            </h1>
            <Formik
              initialValues={initialValues}
              validationSchema={schema}
              onSubmit={async (values, { resetForm }) => {
                await onSubmit(values);
                resetForm();
              }}
            >
              <Form className="flex flex-col space-y-6">
                <div className="relative field">
                  <div className="control">
                    <Field
                      name="username"
                      type="text"
                      placeholder="username"
                      className="focus:outline-none peer block min-h-[auto] w-full rounded border-0 bg-gray-100 px-3 py-[0.32rem] leading-[2.15] outline-none transition-all duration-200 ease-linear"
                    />
                    <ErrorMessage name="username" render={renderError} />
                  </div>
                  <label
                    htmlFor="username"
                    className="mb-20 absolute left-0 -top-3.5 text-letter-color text-sm placeholder-shown:text-base placeholder-shown:text-gray-440 placeholder-shown:top-2 transition-all focus:-top-3.5 focus:text-letter-color focus:text-sm"
                  >
                    User Name
                  </label>
                </div>
                <div className="relative mb-6">
                  <Field
                    name="email"
                    type="text"
                    className="focus:outline-none peer block min-h-[auto] w-full rounded border-0 bg-gray-100 px-3 py-[0.32rem] leading-[2.15] outline-none transition-all duration-200 ease-linear"
                    placeholder="Email"
                  />
                  <ErrorMessage name="email" render={renderError} />
                  <label className="mb-20 absolute left-0 -top-3.5 text-letter-color text-sm placeholder-shown:text-base placeholder-shown:text-gray-440 placeholder-shown:top-2 transition-all focus:-top-3.5 focus:text-letter-color focus:text-sm">
                    Email Address
                  </label>
                </div>
                <div className="relative mb-6">
                  <Field
                    type="password"
                    name="password"
                    className="focus:outline-none peer block min-h-[auto] w-full rounded border-0 bg-gray-100 px-3 py-[0.32rem] leading-[2.15] outline-none transition-all duration-200 ease-linear"
                    placeholder="Password"
                  />
                  <ErrorMessage name="password" render={renderError} />
                  <label className="mb-20 absolute left-0 -top-3.5 text-letter-color text-sm placeholder-shown:text-base placeholder-shown:text-gray-440 placeholder-shown:top-2 transition-all focus:-top-3.5 focus:text-letter-color focus:text-sm">
                    Password
                  </label>
                </div>
                <div className="flex items-left">
                  <input
                    type="checkbox"
                    name="accept"
                    id="accept"
                    className="mr-2"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                  />
                  I accept the
                  <Link className="text-third-color" to="/termsofuse">
                    &nbsp; Terms of Use
                  </Link>
                  &nbsp; and &nbsp;
                  <Link className="text-third-color" to="/datapolicy">
                    Data Policy
                  </Link>
                  .
                </div>
                <Button
                  className="w-full text-xl font-semibold bg-gray-200 border-0 px-7"
                  type="submit"
                  disabled={!acceptTerms || submitting}
                >
                  {submitting ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    "Register"
                  )}
                </Button>
                <p>
                  Already have an account? &nbsp;
                  <Link className="text-third-color" to="/login">
                    Login
                  </Link>
                </p>
              </Form>
            </Formik>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Register;
