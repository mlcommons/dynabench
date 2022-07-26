/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import ReactAudioPlayer from "react-audio-player";

const Player = ({ audio }) => {
  console.log(audio);
  return (
    <>
      <ReactAudioPlayer src={audio} controls />
    </>
  );
};

export default Player;
