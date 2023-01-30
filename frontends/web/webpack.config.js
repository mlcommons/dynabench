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

var path = require("path");
var webpack = require("webpack");
var dotenv = require("dotenv").config({ path: __dirname + "/.env" });

module.exports = {
  entry: "./mturk-src/index.js",
  output: {
    path: __dirname,
    filename: "build/bundle.js",
    library: "mephisto-task",
    libraryTarget: "umd",
  },
  devtool: "source-map",
  resolve: {
    modules: [path.resolve("./"), path.resolve("./node_modules")],
  },
  target: "web",
  node: {
    net: "empty",
    dns: "empty",
  },
  module: {
    rules: [
      {
        "at-rule-no-unknown": [
          true,
          {
            ignoreAtRules: [
              "@tailwind",
              "tailwind",
              "apply",
              "variants",
              "responsive",
              "screen",
            ],
          },
        ],
        "declaration-block-trailing-semicolon": null,
        "no-descending-specificity": null,
      },
      {
        test: /\.(js|jsx)$/,
        loader: "babel-loader",
        exclude: /node_modules/,
        options: {
          presets: [
            "@babel/env",
            "@babel/react",
            {
              plugins: ["@babel/plugin-proposal-class-properties"],
            },
          ],
        },
      },
      {
        test: /\.css$/,
        loader: "style-loader!css-loader",
      },
      {
        test: /\.(svg|png|jpe?g|ttf)$/,
        loader: "url-loader?limit=100000",
      },
      {
        test: /\.jpg$/,
        loader: "file-loader",
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": JSON.stringify(dotenv.parsed),
    }),
  ],
};
