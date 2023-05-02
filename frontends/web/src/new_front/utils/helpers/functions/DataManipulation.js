/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const getIdFromImageString = (list, imageString) => {
  const obj = list.find((item) => item.image === imageString);
  return obj ? obj.id : null;
};
