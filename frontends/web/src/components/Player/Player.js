/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import ReactAudioPlayer from "react-audio-player";

const Player = () => {
  return (
    <>
      <ReactAudioPlayer
        src="https://ia801900.us.archive.org/19/items/randommusic2016_201610/5%20Seconds%20Of%20Summer%20-%20Don%27t%20Stop.mp3"
        controls
      />
    </>
  );
};

export default Player;
