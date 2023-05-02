/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const saveListToLocalStorage = (list, nameList) => {
  localStorage.setItem(nameList, JSON.stringify(list));
};

export const addElementToListInLocalStorage = (newElement, nameList) => {
  let list = getListFromLocalStorage(nameList);
  if (!list.includes(newElement)) {
    list.push(newElement);
    localStorage.setItem(nameList, JSON.stringify(list));
  }
};

export const getListFromLocalStorage = (nameList) => {
  const existingList = JSON.parse(localStorage.getItem(nameList)) || [];
  return existingList;
};
