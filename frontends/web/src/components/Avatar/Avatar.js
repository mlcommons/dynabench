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
import "./Avatar.css";

export const Avatar = ({
  avatar_url,
  username,
  isEditable = false,
  theme = "light",
  isThumbnail = false,
  handleUpdate = () => {},
  loader = false,
}) => {
  const getInitial = (name) => {
    return (
      name &&
      name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    );
  };

  return (
    <>
      {loader && (
        <img className="upload-loader pic" src="/loader.gif" alt="loader" />
      )}
      {avatar_url && !avatar_url !== "" && avatar_url !== "None" ? (
        <div
          className={`avatar-circle ${
            isThumbnail ? "sm inline-block mr-1" : null
          }`}
        >
          <img className="profile-pic" src={avatar_url} alt="profile pic" />
          {isEditable ? (
            <div
              className={`editPic ${
                theme === "light" ? "white-bg" : "bg-black"
              }`}
            >
              <img className="edit-pic-icon" src="/camera.png" alt="edit pic" />
              <input
                className="pic-file-upload"
                type="file"
                title="Click here to upload your profile picture"
                onChange={(e) => handleUpdate(e)}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div
          className={`avatar-circle ${
            theme === "light" ? "white-bg" : "bg-third-color"
          } ${isThumbnail ? "sm inline-block mr-1" : null}`}
        >
          <span
            className={`initials ${
              theme === "light" ? "principal-color" : "text-white"
            }`}
          >
            {getInitial(username)}
          </span>
          {isEditable ? (
            <div className="editPic principal-color-bg">
              <img className="edit-pic-icon" src="/camera.png" alt="edit pic" />
              <input
                className="pic-file-upload"
                type="file"
                title="Click here to upload your profile picture"
                onChange={(e) => handleUpdate(e)}
              />
            </div>
          ) : null}
        </div>
      )}
    </>
  );
};
