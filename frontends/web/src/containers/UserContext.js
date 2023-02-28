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

const UserContext = React.createContext({
  user: {
    admin: false,
    affiliation: null,
    avatar_url: null,
    email: null,
    examples_submitted: 0,
    examples_verified: 0,
    id: null,
    metadata_json: null,
    models_submitted: 0,
    realname: null,
    settings_json: null,
    streak_days: 0,
    streak_days_last_model_wrong: null,
    streak_examples: 0,
    task_permissions: [],
    total_fooled: 0,
    total_retracted: 0,
    total_verified_fooled: 0,
    total_verified_not_correct_fooled: 0,
    unseen_notifications: 0,
    username: null,
  },
});

export default UserContext;
