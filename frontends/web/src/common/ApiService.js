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
import decode from "jwt-decode";
import * as download from "downloadjs";

function delay(t, v) {
  return new Promise(function (resolve) {
    setTimeout(resolve.bind(null, v), t);
  });
}

export default class ApiService {
  constructor(domain) {
    if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
      this.domain = domain || "https://dev.dynabench.org:8081";
    } else {
      this.domain = domain || "https://www.dynabench.org:8080";
    }
    this.alternateDomain =
      process.env.REACT_APP_API_HOST_2 || "https://www.dynabench.org:8080";
    this.fetch = this.fetch.bind(this);
    this.setToken = this.setToken.bind(this);
    this.getToken = this.getToken.bind(this);
    this.login = this.login.bind(this);
    this.register = this.register.bind(this);
    this.getCredentials = this.getCredentials.bind(this);
    this.setMturkMode = this.setMturkMode.bind(this);
    this.updating_already = false;
    this.refreshPromise = null;
    this.mode = "normal";
    this.exportDatasetLog = this.exportDatasetLog.bind(this);
    this.exportPrediction = this.exportPrediction.bind(this);
  }

  setMturkMode() {
    this.mode = "mturk";
  }

  login(email, password) {
    return this.fetch(`${this.domain}/authenticate`, {
      method: "POST",
      body: JSON.stringify({ email: email, password: password }),
    }).then((res) => {
      this.setToken(res.token);
      return res;
    });
  }

  convertToModelIO(tid, data) {
    return this.fetch(`${this.domain}/tasks/${tid}/convert_to_model_io`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  register(email, password, username) {
    return this.fetch(`${this.domain}/users`, {
      method: "POST",
      body: JSON.stringify({
        email: email,
        password: password,
        username: username,
      }),
    }).then((res) => {
      this.setToken(res.token);
      return res;
    });
  }

  forgotPassword(email) {
    return this.fetch(`${this.domain}/recover/initiate`, {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  resetPassword({ email, password, token }) {
    return this.fetch(`${this.domain}/recover/resolve/${token}`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  updateExample(id, data, uid = null) {
    const includeCredentials = this.mode !== "mturk";
    if (this.mode === "mturk") {
      data.uid = uid;
    }
    return this.doFetch(
      `${this.domain}/examples/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      includeCredentials
    );
  }

  updateUser(userId, body) {
    return this.fetch(`${this.domain}/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  updateProfilePic(userId, file) {
    const formData = new FormData();
    formData.append("file", file);
    const token = this.getToken();
    return this.fetch(`${this.domain}/users/${userId}/avatar/upload`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: token ? "Bearer " + token : "None",
      },
    });
  }

  getDynalabTask(TaskCode) {
    return this.doFetch(`${this.domain}/tasks/${TaskCode}/dynalab`, {
      method: "GET",
    });
  }

  getAsyncBadges() {
    return this.fetch(`${this.domain}/badges/getasync`, {
      method: "GET",
    });
  }

  getAPIToken() {
    return this.fetch(`${this.domain}/authenticate/generate_api_token`, {
      method: "GET",
    });
  }

  getTrialAuthToken() {
    return this.fetch(`${this.domain}/authenticate/get_trial_token`, {
      method: "GET",
    }).then((res) => {
      localStorage.setItem("trial_auth_token", res.token);
      return res;
    });
  }

  getTasks() {
    return this.fetch(`${this.alternateDomain}/task/all_active`, {
      method: "GET",
    });
  }

  getSubmittableTasks() {
    return this.fetch(`${this.domain}/tasks/submitable`, {
      method: "GET",
    });
  }

  submitContexts(tid, rid, data) {
    const token = this.getToken();
    const formData = new FormData();
    formData.append("file", data.file);
    return this.fetch(`${this.domain}/contexts/upload/${tid}/${rid}`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: token ? "Bearer " + token : "None",
      },
    });
  }

  updateModel({
    modelId,
    name,
    description,
    params,
    languages,
    license,
    source_url,
    model_card,
    is_anonymous,
  }) {
    return this.fetch(`${this.domain}/models/${modelId}/update`, {
      method: "PUT",
      body: JSON.stringify({
        name,
        description,
        params,
        languages,
        license,
        source_url,
        model_card,
        is_anonymous,
      }),
    });
  }

  toggleModelStatus(modelId) {
    return this.fetch(`${this.domain}/models/${modelId}/revertstatus`, {
      method: "PUT",
    });
  }

  getTrends(taskId) {
    return this.fetch(`${this.alternateDomain}/task/trends/${taskId}`, {
      method: "GET",
    });
  }

  getDynaboardScores(
    taskId,
    limit,
    offset,
    sort,
    sortDirection,
    metricWeights,
    datasetWeights
  ) {
    const pageQuery = `limit=${limit || 10}&offset=${offset || 0}`;
    const sortQuery =
      sort && sortDirection
        ? `&sort_by=${sort}&sort_direction=${sortDirection}`
        : "";

    const metricWeightsQuery = metricWeights
      ? `&ordered_metric_weights=${encodeURIComponent(metricWeights.join("|"))}`
      : "";

    const datasetWeightsQuery = datasetWeights
      ? `&ordered_scoring_dataset_weights=${encodeURIComponent(
          datasetWeights.join("|")
        )}`
      : "";

    const url = `/models/dynaboard?${pageQuery}${sortQuery}${metricWeightsQuery}${datasetWeightsQuery}`;
    return this.fetch(`${this.domain}/tasks/${taskId}${url}`, {
      method: "GET",
    });
  }

  getLeaderboardTopPerformingTags(taskId, limit, offset, specific_tag = null) {
    const pageQuery = `limit=${limit || 10}&offset=${offset || 0}`;
    const specificTagQuery =
      specific_tag === null ? `` : `&specific_tag=${specific_tag}`;
    const url = `/models/topleaderboardtags?${pageQuery}${specificTagQuery}`;
    return this.fetch(`${this.domain}/tasks/${taskId}${url}`, {
      method: "GET",
    });
  }

  getOverallModelLeaderboard(taskId, round, limit, offset) {
    const url =
      round === "overall"
        ? `/models?limit=${limit || 10}&offset=${offset || 0}`
        : `/rounds/${round}/models?limit=${limit || 10}&offset=${offset || 0}`;
    return this.fetch(`${this.domain}/tasks/${taskId}${url}`, {
      method: "GET",
    });
  }

  deployModel(modelId) {
    return this.fetch(`${this.domain}/models/${modelId}/deploy`, {
      method: "GET",
    });
  }

  getOverallUserLeaderboard(taskId, round, limit, offset) {
    const url =
      round === "overall"
        ? `/users?limit=${limit || 10}&offset=${offset || 0}`
        : `/rounds/${round}/users?limit=${limit || 10}&offset=${offset || 0}`;
    return this.fetch(`${this.domain}/tasks/${taskId}${url}`, {
      method: "GET",
    });
  }

  getUser(id, badges = false) {
    var url = `${this.alternateDomain}/user/${id}`;
    if (badges) {
      url += "/badges";
    }
    return this.fetch(url, {
      method: "GET",
    });
  }

  getTask(idOrCode) {
    const includeCredentials = this.mode !== "mturk";
    return this.doFetch(
      `${this.alternateDomain}/task/round_and_metric_data/${idOrCode}`,
      {
        method: "GET",
      },
      includeCredentials
    );
  }

  getTaskRound(id, rid) {
    return this.fetch(`${this.domain}/tasks/${id}/${rid}`, {
      method: "GET",
    });
  }

  getRandomContext(tid, rid, tags = [], method = "min") {
    const includeCredentials = this.mode !== "mturk";

    return this.doFetch(
      `${
        this.domain
      }/contexts/${tid}/${rid}/${method}?tags=${encodeURIComponent(
        tags.join("|")
      )}`,
      {
        method: "GET",
      },
      includeCredentials
    );
  }

  getRandomExample(
    tid,
    rid,
    tags = [],
    context_tags = [],
    annotator_id = null
  ) {
    const includeCredentials = this.mode !== "mturk";

    let annotator_query = annotator_id ? `&annotator_id=${annotator_id}` : "";
    let context_tags_query =
      context_tags.length > 0
        ? `&context_tags=${encodeURIComponent(context_tags.join("|"))}`
        : "";
    return this.doFetch(
      `${this.domain}/examples/${tid}/${rid}?tags=${encodeURIComponent(
        tags.join("|")
      )}${context_tags_query}${annotator_query}`,
      {
        method: "GET",
      },
      includeCredentials
    );
  }

  getRandomFilteredExample(
    tid,
    rid,
    minNumFlags,
    maxNumFlags,
    minNumDisagreements,
    maxNumDisagreements,
    tags = []
  ) {
    return this.fetch(
      `${
        this.domain
      }/examples/${tid}/${rid}/filtered/${minNumFlags}/${maxNumFlags}/${minNumDisagreements}/${maxNumDisagreements}?tags=${encodeURIComponent(
        tags.join("|")
      )}`,
      {
        method: "GET",
      }
    );
  }

  getModel(modelId) {
    return this.fetch(`${this.domain}/models/${modelId}/details`, {
      method: "GET",
    });
  }

  setNotificationsSeen(userId) {
    return this.fetch(`${this.domain}/notifications/seen`, {
      method: "PUT",
    });
  }
  getNotifications(userId, limit, offset) {
    return this.fetch(
      `${this.domain}/notifications?limit=${limit || 10}&offset=${offset || 0}`,
      {
        method: "GET",
      }
    );
  }

  getUserModels(userId, limit, offset) {
    return this.fetch(
      `${this.domain}/users/${userId}/models?limit=${limit || 10}&offset=${
        offset || 0
      }`,
      {
        method: "GET",
      }
    );
  }

  getUserTasks(userId, limit, offset) {
    return this.fetch(
      `${this.domain}/users/${userId}/tasks?limit=${limit || 10}&offset=${
        offset || 0
      }`,
      {
        method: "GET",
      }
    );
  }

  getUserForks(userId, limit, offset) {
    return this.fetch(
      `${this.domain}/users/${userId}/forks?limit=${limit}&offset=${offset}`,
      {
        method: "GET",
      }
    );
  }

  getUserSnapshots(userId, limit, offset) {
    return this.fetch(
      `${this.domain}/users/${userId}/snapshots?limit=${limit}&offset=${offset}`,
      {
        method: "GET",
      }
    );
  }

  getModelResponse(modelUrl, data) {
    const trialAuthToken = localStorage.getItem("trial_auth_token");
    const customHeader =
      this.loggedIn() || this.mode === "mturk" || trialAuthToken == null
        ? null
        : {
            Accept: "application/json",
            Authorization: "Bearer " + trialAuthToken,
            "Content-Type": "application/json",
          };
    return this.fetch(modelUrl, {
      method: "POST",
      body: JSON.stringify(data),
      ...(customHeader == null ? {} : { headers: customHeader }),
    });
  }

  exportData(tid, rid = null) {
    var export_link = `${this.alternateDomain}/tasks/${tid}`;
    if (rid !== null) {
      export_link += `/rounds/${rid}`;
    }
    export_link += "/export";
    return this.fetch(export_link, {
      method: "GET",
    }).then((res) => {
      res = new TextEncoder("utf-8").encode(JSON.stringify(res));
      return download(res, "export.json", "text/json");
    });
  }

  exportDatasetLog(mid, did) {
    return this.fetch(`${this.domain}/models/latest_job_log/${mid}/${did}`, {
      method: "GET",
    }).then((res) => {
      res = new TextEncoder("utf-8").encode(JSON.stringify(res));
      return download(res, "log.json", "text/json");
    });
  }

  exportPrediction(mid, did) {
    return this.fetch(`${this.domain}/models/predictions/${mid}/${did}`, {
      method: "GET",
    }).then((res) => {
      res = new TextEncoder("utf-8").encode(JSON.stringify(res));
      return download(res, "log.json", "text/json");
    });
  }

  getExampleMetadata(id) {
    return this.fetch(`${this.domain}/examples/${id}/metadata`, {
      method: "GET",
    });
  }

  getExample(id) {
    return this.fetch(`${this.domain}/examples/${id}`, {
      method: "GET",
    });
  }

  getAdminOrOwner(tid) {
    const includeCredentials = this.mode !== "mturk";
    return this.doFetch(
      `${this.alternateDomain}/auth/is_admin_or_owner/${tid}`,
      {
        method: "GET",
      },
      includeCredentials
    );
  }

  setExampleMetadata(id, metadata) {
    var obj = {};
    obj.metadata_json = JSON.stringify(metadata);
    return this.fetch(`${this.domain}/examples/${id}`, {
      method: "PUT",
      body: JSON.stringify(obj),
    });
  }

  retractExample(id, uid = null) {
    const includeCredentials = this.mode !== "mturk";
    let obj = { retracted: true };
    if (this.mode === "mturk") {
      obj.uid = uid;
    }
    return this.doFetch(
      `${this.domain}/examples/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(obj),
      },
      includeCredentials
    );
  }

  validateExample(id, label, mode, metadata = {}, uid = null) {
    const includeCredentials = this.mode !== "mturk";
    let obj = {
      label: label,
      mode: mode,
      metadata: metadata,
    };
    if (this.mode === "mturk") {
      obj.uid = uid;
    }
    return this.doFetch(
      `${this.domain}/validations/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(obj),
      },
      includeCredentials
    );
  }

  flagExample(id, uid = null) {
    let obj = { flagged: true };
    if (this.mode === "mturk") {
      obj.uid = uid;
    }
    return this.fetch(`${this.domain}/examples/${id}`, {
      method: "PUT",
      body: JSON.stringify(obj),
    });
  }

  inspectModel(modelUrl, data) {
    return this.doFetch(
      modelUrl,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      false
    );
  }

  getModelWrong(tid, target, output) {
    let obj = {
      target: target,
      tid: tid,
      output: output,
    };
    return this.fetch(`${this.domain}/examples/evaluate`, {
      method: "POST",
      body: JSON.stringify(obj),
    });
  }

  getAllTaskProposals(page, pageLimit) {
    return this.fetch(
      `${this.domain}/task_proposals/all/${page}/${pageLimit}`,
      {
        method: "GET",
      }
    );
  }

  getUserTaskProposals(page, pageLimit) {
    return this.fetch(
      `${this.domain}/task_proposals/user/${page}/${pageLimit}`,
      {
        method: "GET",
      }
    );
  }

  createTaskProposal(name, task_code, desc, longdesc) {
    let obj = {
      name: name,
      desc: desc,
      longdesc: longdesc,
      task_code: task_code,
    };
    return this.fetch(`${this.domain}/task_proposals/create`, {
      method: "POST",
      body: JSON.stringify(obj),
    });
  }

  processTaskProposal(tpid, accept, changes) {
    let obj = {
      accept: accept,
      changes: changes || "",
    };
    return this.fetch(`${this.domain}/tasks/process_proposal/${tpid}`, {
      method: "PUT",
      body: JSON.stringify(obj),
    });
  }

  updateTask(tid, data) {
    return this.fetch(`${this.domain}/tasks/update/${tid}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  toggleOwner(tid, username) {
    return this.fetch(`${this.domain}/tasks/toggle_owner/${tid}/${username}`, {
      method: "PUT",
    });
  }

  getOwners(tid, username) {
    return this.fetch(`${this.domain}/tasks/owners/${tid}`, {
      method: "GET",
    });
  }

  getRounds(tid) {
    return this.fetch(`${this.domain}/tasks/get_all_rounds/${tid}`, {
      method: "GET",
    });
  }

  activateTask(tid, config_yaml) {
    return this.fetch(`${this.domain}/tasks/activate/${tid}`, {
      method: "PUT",
      body: JSON.stringify({ config_yaml: config_yaml }),
    });
  }

  updateModelsInTheLoop(tid, rid, data) {
    return this.fetch(
      `${this.domain}/tasks/update_models_in_the_loop/${tid}/${rid}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
  }

  createRound(tid) {
    return this.fetch(`${this.domain}/tasks/create_round/${tid}`, {
      method: "POST",
    });
  }

  getModelIdentifiersForTargetSelection(tid) {
    return this.fetch(`${this.domain}/tasks/get_models_in_the_loop/${tid}`, {
      method: "GET",
    });
  }

  getModelIdentifiers(tid) {
    return this.fetch(`${this.domain}/tasks/get_model_identifiers/${tid}`, {
      method: "GET",
    });
  }

  getAvailableDatasetAccessTypes() {
    return this.fetch(`${this.domain}/datasets/get_access_types`, {
      method: "GET",
    });
  }

  getAvailableDatasetLogAccessTypes() {
    return this.fetch(`${this.domain}/datasets/get_log_access_types`, {
      method: "GET",
    });
  }

  getDatasets(tid) {
    return this.fetch(`${this.domain}/tasks/datasets/${tid}`, {
      method: "GET",
    });
  }

  updateDataset(did, data) {
    return this.fetch(`${this.domain}/datasets/update/${did}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  uploadAndCreateDataset(tid, name, files) {
    const token = this.getToken();
    const formData = new FormData();
    for (const [name, file] of Object.entries(files)) {
      formData.append(name, file);
    }
    return this.fetch(`${this.domain}/datasets/create/${tid}/${name}`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: token ? "Bearer " + token : "None",
      },
    });
  }

  deleteDataset(did) {
    return this.fetch(`${this.domain}/datasets/delete/${did}`, {
      method: "DELETE",
    });
  }

  uploadTrainFiles(tid, modelName, files, source_url = null) {
    const token = this.getToken();
    const formData = new FormData();
    for (const [name, file] of Object.entries(files)) {
      formData.append(name, file);
    }
    if (source_url) {
      formData.append("source_url", source_url);
    }
    return this.fetch(
      `${this.domain}/models/upload_train_files/${tid}/${modelName}`,
      {
        method: "POST",
        body: formData,
        headers: {
          Authorization: token ? "Bearer " + token : "None",
        },
      }
    );
  }

  uploadPredictions(tid, modelName, files) {
    const token = this.getToken();
    const formData = new FormData();
    for (const [name, file] of Object.entries(files)) {
      formData.append(name, file);
    }
    return this.fetch(
      `${this.domain}/models/upload_predictions/${tid}/${modelName}`,
      {
        method: "POST",
        body: formData,
        headers: {
          Authorization: token ? "Bearer " + token : "None",
        },
      }
    );
  }

  storeExample(
    tid,
    rid,
    uid,
    cid,
    input,
    output,
    modelSignature,
    metadata,
    modelWrong,
    tag = null,
    modelEndpointName = null
  ) {
    const includeCredentials = this.mode !== "mturk";
    return this.doFetch(
      `${this.domain}/examples`,
      {
        method: "POST",
        body: JSON.stringify({
          tid: tid,
          rid: rid,
          cid: cid,
          uid: uid,
          input: input,
          output: output,
          model_signature: modelSignature,
          metadata: metadata,
          model_wrong: modelWrong,
          tag: tag,
          model_endpoint_name: modelEndpointName,
        }),
      },
      includeCredentials
    );
  }

  createLeaderboardConfiguration(tid, name, configuration_json, description) {
    return this.fetch(`${this.domain}/tasks/${tid}/leaderboard_configuration`, {
      method: "PUT",
      body: JSON.stringify({
        name: name,
        configuration_json: configuration_json,
        description: description,
      }),
    });
  }

  getLeaderboardConfiguration(tid, name) {
    return this.fetch(
      `${this.domain}/tasks/${tid}/leaderboard_configuration/${name}`,
      {
        method: "GET",
      }
    );
  }

  createLeaderboardSnapshot(
    tid,
    sort,
    metricWeights,
    datasetWeights,
    orderedMetricWeights,
    orderedDatasetWeights,
    totalCount,
    description,
    name
  ) {
    return this.fetch(`${this.domain}/tasks/${tid}/leaderboard_snapshot`, {
      method: "PUT",
      body: JSON.stringify({
        sort: sort,
        metricWeights: metricWeights,
        datasetWeights: datasetWeights,
        orderedMetricWeights: orderedMetricWeights,
        orderedDatasetWeights: orderedDatasetWeights,
        totalCount: totalCount,
        description: description,
        name: name,
      }),
    });
  }

  getLeaderboardSnapshot(tid, name) {
    return this.fetch(
      `${this.domain}/tasks/${tid}/leaderboard_snapshot/${name}`,
      {
        method: "GET",
      }
    );
  }

  disambiguateForkAndSnapshot(tid, name) {
    return this.fetch(
      `${this.domain}/tasks/${tid}/disambiguate_forks_and_snapshots/${name}`,
      {
        method: "GET",
      }
    );
  }

  loggedIn() {
    const token = this.getToken();
    if (!token) {
      //console.log("We do not have a token");
      return false;
    } else if (!!token && !this.isTokenExpired(token)) {
      //console.log("We have a valid token");
      return true;
    } else {
      //console.log("We have a token that is not longer valid - refreshing");
      return this.refreshTokenWrapper(
        function () {
          //console.log("Token refreshed");
          return true;
        },
        function () {
          console.log("Could not refresh token (loggedIn)");
          localStorage.removeItem("id_token");
          //window.location.href = '/login';
          return false;
        }
      );
    }
  }

  isTokenExpired(token) {
    try {
      const decoded = decode(token);
      //The exp field is in seconds, so we multiply by 1000 to get milliseconds
      //equal to the date object got by Date.now().
      if (decoded.exp * 1000 < Date.now()) {
        // Checking if token is expired. N
        return true;
      } else return false;
    } catch (err) {
      return false;
    }
  }

  setToken(idToken) {
    localStorage.setItem("id_token", idToken);
    localStorage.removeItem("trial_auth_token");
  }

  getToken() {
    // handle access not allowed to localStorage if disabled in browser.
    // https://stackoverflow.com/questions/16427636/check-if-localstorage-is-available
    try {
      const token = localStorage.getItem("id_token");
      return token;
    } catch (e) {
      return null;
    }
  }

  logout() {
    try {
      this.fetch(`${this.alternateDomain}/auth/logout`, {
        method: "POST",
      });
    } catch (e) {
      console.log("Could not logout");
      console.warn(e);
    }
    localStorage.removeItem("id_token");
  }

  getCredentials() {
    //console.log(this.getToken());
    return this.getToken() ? decode(this.getToken()) : {};
  }

  async refreshTokenWrapper(callback, errorCallback) {
    if (this.refreshPromise) {
      try {
        await this.refreshPromise;
        return callback();
      } catch (error) {
        return errorCallback();
      }
    }

    // Start new refresh
    this.refreshPromise = this.refreshToken().finally(() => {
      this.refreshPromise = null; // Clear when done (success or failure)
    });

    try {
      await this.refreshPromise;
      return callback();
    } catch (error) {
      return errorCallback();
    }
  }

  refreshToken() {
    return this.doFetch(`${this.alternateDomain}/auth/refresh`, {}, true).then(
      (result) => {
        this.setToken(result.token);
      }
    );
  }

  doFetch(url, options, includeCredentials = false) {
    const token = this.mode !== "mturk" ? this.getToken() : null;

    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: token
        ? "Bearer " + token
        : this.mode === "mturk"
        ? "turk"
        : "None",
    };
    options = {
      headers,
      ...options,
    };
    if (includeCredentials) {
      options.credentials = "include";
    }
    return fetch(url, options).then(this.errorHandler);
  }

  async fetch(url, options) {
    const token = this.mode !== "mturk" ? this.getToken() : null;
    if (
      !!token &&
      this.isTokenExpired(token) &&
      url !== `${this.alternateDomain}/login`
    ) {
      try {
        await this.refreshTokenWrapper(
          () => {
            //console.log("Our token was refreshed (fetch callback)");
            return Promise.resolve();
          },
          () => {
            localStorage.removeItem("id_token");
            //window.location.href = '/login';
            throw new Error("Could not refresh token");
          }
        );

        return this.doFetch(url, options, true);
      } catch (error) {
        throw error;
      }
    }
    return this.doFetch(url, options, true);
  }

  errorHandler(response) {
    try {
      if (response.status >= 200 && response.status < 300) {
        return Promise.resolve(response.json());
      } else {
        return Promise.resolve(response.json()).then((responseInJson) => {
          return Promise.reject(responseInJson);
        });
      }
    } catch (error) {
      console.log(error);
    }
  }
}
