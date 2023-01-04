/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import "./Dataperf.css";

const Dataperf = () => {
  return (
    <>
      <div className="dataperf-hero">
        <img
          className="dataperf-hero-inner"
          src="https://dataperf.org/dataperf_inner.png"
          alt="DataPerf logo"
        />
        <div className="dataperf-hero-subtitle">
          <p>Announcement and Call for Participation</p>
          <p>
            <a class="a-white" href="https://arxiv.org/abs/2207.10062">
              Whitepaper
            </a>{" "}
            -
            <a
              class="a-white"
              href="https://groups.google.com/a/mlcommons.org/g/dataperf-announce?hl=en"
            >
              Email List
            </a>{" "}
            -
            <a
              class="a-white"
              href="https://mlcommons.org/en/groups/research-dataperf/"
            >
              Working Group
            </a>{" "}
            -
            <a class="a-white" href="https://dataperf.org/challenges.html">
              Challenges
            </a>
          </p>
        </div>
      </div>
      <div className="dataperf-introduction">
        <p>
          We, researchers from Coactive.AI, ETH Zurich, Google, Harvard
          University, Landing.AI, Meta, Stanford University, and TU Eindhoven,
          are announcing DataPerf, a new benchmark suite for machine learning
          datasets and data-centric algorithms. We are presenting DataPerf at
          the NeurIPS Data-centric AI Workshop. Going forward, we invite you to
          join us in defining and developing the benchmark suite in the DataPerf
          Working Group hosted by the MLCommons® Association. If you are
          interested in using the DataPerf benchmark or participating in
          leaderboards and challenges based on DataPerf in 2022, please sign up
          for DataPerf-announce (click link then "Ask to Join").
          <br />
          <br />
          Introduction. DataPerf is a benchmark suite for ML datasets and
          data-centric algorithms. Historically, ML research has focused
          primarily on models, and simply used the largest existing dataset for
          common ML tasks without considering the dataset’s breadth, difficulty,
          and fidelity to the underlying problem. This under-focus on data has
          led to a range of issues, from data cascades in real applications, to
          saturation of existing dataset-driven benchmarks for model quality
          impeding research progress. In order to catalyze increased research
          focus on data quality and foster data excellence, we created DataPerf:
          a suite of benchmarks that evaluate the quality of training and test
          data, and the algorithms for constructing or optimizing such datasets,
          such as core set selection or labeling error debugging, across a range
          of common ML tasks such as image classification. We plan to leverage
          the DataPerf benchmarks through challenges and leaderboards.
          <br />
          <br />
          Inspiration. We are motivated by a number of prior efforts including:
          efforts to develop adversarial data such as Cats4ML and Dynabench,
          efforts to develop specific benchmarks or similar suites such as the
          DCAI competition and DCBench, and the MLPerf™ benchmarks for ML speed.
          We aim to provide clear evaluation and encourage rapid innovation
          aimed at conferences and workshops such as the NeurIPS Datasets and
          Benchmarks track. Similar to the MLPerf effort, we’ve brought together
          the leaders of these motivating efforts to build DataPerf.
        </p>
      </div>
      <div className="dataperf-goals">
        <p>
          <b>Goals.</b> DataPerf has these goals:
          <ul>
            <li>
              Focus research and development on improving ML dataset quality
            </li>
            <li>
              Improve ML training datasets to increase accuracy and/or reduce
              data required to train
            </li>
            <li>
              Improve ML test datasets to drive ML solution fidelity and
              reliability
            </li>
            <li>
              Motivate datasets that increase representation and decrease bias
            </li>
            <li>
              Drive development of better techniques and tools for creating and
              optimizing datasets
            </li>
            <li>
              Provide consistent metrics for researchers and commercial
              developers
            </li>
            <li>Enforce replicability to ensure reliable results</li>
            <li>Keep benchmarking effort affordable so all can participate</li>
          </ul>
        </p>
      </div>
    </>
  );
};

export default Dataperf;
