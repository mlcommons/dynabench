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
import { ValidQuestionCharacteristics } from "./QuestionsCharacteristics.js";

class VQAPreview extends React.Component {
  render() {
    const explain_onboarding =
      "If this is your first time doing this task, you will be asked to go through a qualification stage before you are allowed to enter the main task.";
    return (
      <div style={{ width: "100%", height: "100%", backgroundColor: "white" }}>
        {this.props.previewMode === "creation" ? (
          <div className="mx-5 my-3">
            <h1>Ask Questions About Images That Fool An AI</h1>
            <p>
              In this task, you will be asked to find questions about an image
              that fool an AI model into answering incorrectly. The AI is
              reasonably good at understanding English and interpreting images.{" "}
              {explain_onboarding}
            </p>
            <p>
              Given an <b>image</b> that you will use as context, you are
              expected to do the following:
            </p>
            <ol className="mx-5">
              <li>
                Write a <b>valid question</b> based on the image that you think
                the AI would get <b>wrong</b> but another person would get{" "}
                <b>right</b>.
              </li>
              <li>
                Verify AI's answer:
                <ul className="mx-3" style={{ listStyleType: "disc" }}>
                  <li>
                    If the AI's answer was correct, select the
                    <b style={{ color: "green" }}> Correct</b> button.
                  </li>
                  <li>
                    If the AI's answer was incorrect, that is, the AI was
                    successfully fooled, select the{" "}
                    <b style={{ color: "red" }}> Incorrect</b> button and{" "}
                    <b>provide the correct answer</b> for your question.
                  </li>
                </ul>
              </li>
            </ol>
            <p>
              Sometimes AI might be tricky to fool. When you have spent 3 tries
              without success you will be able to skip to the next image by
              clicking <b style={{ color: "blue" }}>Skip Image</b>.
            </p>
            <h3>Completion</h3>
            <p>
              An HIT can be completed if you successfully <b>fool the model</b>{" "}
              or if you reach <b>10 tries</b>. Any of those events unlock the{" "}
              <b>Submit HIT</b> button. You will recieve an additional bonus
              payment <b>only if</b> you fool the model.
            </p>
            <h3>Reward</h3>
            <p>
              On completing the HIT you will receive $0.12. If other people
              agreed that you fooled the model, you will receive an additional
              bonus of $0.35. Therefore we highly encourage you to try to find
              creative questions to fool the model.
            </p>
            <p>
              The AI utilizes the latest technologies to understand language and
              can be very smart. Be creative to fool the AI - it will be fun!
            </p>
          </div>
        ) : (
          <div className="mx-5 my-3">
            <h1>Validate Examples</h1>
            <p>
              In this task, you will be asked to validate the examples
              consisting of an image, a question and an answer. You will be
              asked to do the following:
            </p>
            <ol className="mx-5">
              <li>
                Determine if the question is{" "}
                <b className="dark-principal-color">valid</b>. A question is
                considered to be valid if:
                <ValidQuestionCharacteristics />
              </li>
              <li>
                If the question is valid, determine whether the provided answer
                is <b className="dark-principal-color">correct</b>.
              </li>
            </ol>
            <p>
              If you think the example should be reviewed, please click the{" "}
              <b>Flag</b> button and explain why you flagged the example (try to
              use this sparingly).
            </p>
            <p>{explain_onboarding}</p>
            <h3>Completion</h3>
            <p>The HIT is completed when you validate 10 examples.</p>
            <h3>Reward</h3>
            <p>On completing the task you will receive $0.35.</p>
          </div>
        )}
      </div>
    );
  }
}

export { VQAPreview };
