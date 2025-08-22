import React, { FC, useContext, useEffect, useState } from "react";
import { Link, useHistory, useLocation } from "react-router-dom";
import { Button } from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";

import UserContext from "containers/UserContext";
import { ReactComponent as Login } from "new_front/assets/login.svg";

const LoginPage: FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { updateState } = useContext(UserContext);
  const originalPath = localStorage.getItem("originalPath");
  const history = useHistory();
  const location = useLocation();
  const { t } = useTranslation();

  const queryParams = new URLSearchParams(location.search);
  const assignmentId =
    queryParams.get("assignmentId") === "null"
      ? null
      : queryParams.get("assignmentId");
  const taskCode =
    queryParams.get("taskCode") === "null" ? null : queryParams.get("taskCode");
  const treatmentId =
    queryParams.get("treatmentId") === "null"
      ? null
      : queryParams.get("treatmentId");
  const srcURL =
    queryParams.get("src") === "null" ? null : queryParams.get("src");

  const handleAmazonTurk = (assignmentId: string) => {
    setEmail(`${assignmentId}@amazonturk.com`);
    setPassword(assignmentId);
  };

  useEffect(() => {
    console.log("assignmentId", assignmentId);
    console.log("taskCode", taskCode);
  }, []);

  const handleLogin = () => {
    axios
      .post(`${process.env.REACT_APP_API_HOST_2}/user_public/authenticate`, {
        email: email,
        password: password,
      })
      .then((response) => {
        localStorage.setItem("id_token", response.data.token);
        updateState({
          user: response.data.user,
        });
        console.log("Login successful", response);
        if (taskCode && srcURL) {
          history.push(
            `/tasks/${taskCode}${srcURL}?assignmentId=${assignmentId}&treatmentId=${treatmentId}`,
          );
        } else if (taskCode) {
          history.push(
            `/tasks/${taskCode}/create?assignmentId=${assignmentId}&treatmentId=${treatmentId}`,
          );
        } else if (originalPath === "/") {
          history.push("/account");
        } else {
          history.goBack();
        }
      })
      .catch((error) => {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Something went wrong! try another email or password",
        });
      });
  };

  useEffect(() => {
    if (assignmentId) {
      handleAmazonTurk(assignmentId);
      if (email && password) {
        handleLogin();
      }
    }
  }, [email]);

  return (
    <section className="h-screen bg-gradient-to-b from-white to-[#ccebd466]">
      <div className="container h-full p-32">
        <div className="flex flex-wrap items-center justify-center h-full g-6 lg:justify-between">
          <div className="mb-12 md:mb-0 md:w-8/12 lg:w-6/12">
            <Login className="w-full h-full" />
          </div>
          <div className="md:w-8/12 lg:ml-6 lg:w-5/12">
            <h1 className="pb-8 mb-6 text-4xl font-bold text-letter-color">
              {t("common:messages.welcomeBack")}
            </h1>
            <form className="flex flex-col space-y-6">
              <div className="relative mb-6" data-te-input-wrapper-init>
                <input
                  type="text"
                  className="focus:outline-none peer block min-h-[auto] w-full rounded border-0 bg-gray-100 px-3 py-[0.32rem] leading-[2.15] outline-none transition-all duration-200 ease-linear"
                  id="email"
                  placeholder={t("auth:login.email")}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <label className="mb-20 absolute left-0 -top-3.5 text-letter-color text-sm placeholder-shown:text-base placeholder-shown:text-gray-440 placeholder-shown:top-2 transition-all focus:-top-3.5 focus:text-letter-color focus:text-sm">
                  {t("auth:login.emailAddress")}
                </label>
              </div>
              <div className="relative mb-6" data-te-input-wrapper-init>
                <input
                  type="password"
                  className="focus:outline-none peer block min-h-[auto] w-full rounded border-0 bg-gray-100 px-3 py-[0.32rem] leading-[2.15] outline-none transition-all duration-200 ease-linear"
                  id="password"
                  placeholder={t("auth:login.password")}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <label className="mb-20 absolute left-0 -top-3.5 text-letter-color text-sm placeholder-shown:text-base placeholder-shown:text-gray-440 placeholder-shown:top-2 transition-all focus:-top-3.5 focus:text-letter-color focus:text-sm">
                  {t("auth:login.password")}
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div className="mb-3">
                  <p>
                    {t("auth:login.noAccount")}{" "}
                    <Link className="underline-hover" to="/register">
                      {t("auth:login.signUp")}
                    </Link>
                  </p>
                  <p>
                    <Link className="underline-hover" to="/forgot-password">
                      {t("auth:login.forgotPassword")}
                    </Link>
                  </p>
                </div>
              </div>

              <Button
                className="w-full text-xl font-semibold bg-gray-200 border-0 px-7"
                onClick={handleLogin}
              >
                {t("auth:login.signIn")}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginPage;
