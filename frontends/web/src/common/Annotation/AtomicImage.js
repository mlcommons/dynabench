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
import Magnifier from "react-magnifier";
import ErrorAlert from "./ErrorAlert.js";

class AtomicImage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isImgLoaded: false,
      width: 0,
      height: this.props.maxHeight,
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.src !== this.props.src) {
      this.setState({ isImgLoaded: false });
    }
  }

  onImgLoad = ({ target: img }) => {
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    const { maxHeight, maxWidth } = this.props;
    let height = 0,
      width = 0;
    if (maxHeight * aspectRatio > maxWidth) {
      width = maxWidth;
      height = maxWidth / aspectRatio;
    } else {
      height = maxHeight;
      width = maxHeight * aspectRatio;
    }
    this.setState({
      width,
      height,
      isImgLoaded: true,
    });
  };

  render() {
    if (this.props.src && this.props.src.length > 0) {
      return (
        <>
          <img
            src={this.props.src}
            style={{ display: "none" }}
            onLoad={this.onImgLoad}
            alt="annotation"
          />
          <div
            className="d-flex align-items-center justify-content-center"
            style={{ height: this.state.height }}
          >
            {console.log("state", this.state)}
            {this.state.isImgLoaded ? (
              <Magnifier
                mgWidth={250}
                mgHeight={250}
                width={this.state.width}
                height={this.state.height}
                src={this.props.src}
                mgShape={"square"}
                style={{
                  display: this.state.isImgLoaded ? "block" : "none",
                }}
              />
            ) : (
              <div className="spinner-border" role="status" />
            )}
          </div>
        </>
      );
    } else {
      return <ErrorAlert />;
    }
  }
}

export default AtomicImage;
