/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import decode from "jwt-decode";

export const checkUserIsLoggedIn = async (
  history,
  url,
  assignmentId,
  taskCode
) => {
  const login = await isLogin();
  return sendUserToLogin(login, history, url, assignmentId, taskCode);
};

const isLogin = async () => {
  const token = localStorage.getItem("id_token");
  if (!token) {
    return false;
  } else if (isTokenExpired(token)) {
    return false;
  } else if (token) {
    return true;
  }
  return true;
};

const sendUserToLogin = (login, history, url, assignmentId, taskCode) => {
  if (!login) {
    history.push(
      "/login?msg=" +
        encodeURIComponent(
          "Please sign up or log in so that you can upload a model"
        ) +
        "&src=" +
        encodeURIComponent(url) +
        "&assignmentId=" +
        encodeURIComponent(assignmentId) +
        "&taskCode=" +
        encodeURIComponent(taskCode)
    );
  } else {
    return true;
  }
};

const isTokenExpired = (token) => {
  const decoded = decode(token);
  const currentTime = Date.now() / 100000;
  if (decoded.exp < currentTime) {
    return true;
  }
  return false;
};
