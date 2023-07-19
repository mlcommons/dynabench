import { motion } from "framer-motion";
import { fadeIn } from "new_front/utils/helpers/motion";
import React from "react";
import { Button } from "react-bootstrap";
import { ReactComponent as Other } from "new_front/assets/other.svg";
import { ReactComponent as LLM } from "new_front/assets/llm.svg";
import { ReactComponent as Baby } from "new_front/assets/baby.svg";
import { Link } from "react-router-dom";

const Communities = () => {
  return (
    <>
      <div className="container mx-auto pt-4">
        <a
          className="flex flex-row justify-center hover:no-underline pointer"
          href="/communities"
        >
          <motion.h2
            className="flex flex-row my-2 text-5xl font-bold leading-tight text-center text-letter-color"
            variants={fadeIn("right", "tween", 0.5, 0.5)}
            initial="initial"
            animate="animate"
          >
            Communities
          </motion.h2>
        </a>

        <div className="flex flex-wrap my-12">
          <div className="w-5/6 p-6 sm:w-1/2 z-50">
            <a
              className="flex flex-row gap-1 pointer hover:no-underline"
              href="/dadc"
            >
              <h3 className="mb-3 text-3xl font-bold leading-none text-letter-color">
                Dynamical Adversarial
              </h3>
            </a>
            <p className="mb-8 text-lg text-gray-600">
              The basic idea is that we collect human data dynamically with
              models in the loop. Humans can be tasked with finding adversarial
              examples that fool current state-of-the-art models, for example,
              or models can be cooperative and help humans find interesting
              examples. This offers two benefits: it allows us to gauge how good
              our current SOTA methods really are; and it yields data that may
              be used to further train even stronger SOTA models.
            </p>
            <Button
              className="p-2 text-lg font-semibold border-0 rounded-full bg-primary-color"
              as={Link}
              to="/dadc"
            >
              Learn more
            </Button>
          </div>
          <div className="w-full p-6 sm:w-1/2">
            <div
              id="responsiveVideoWrapper"
              className="relative h-0 overflow-hidden rounded-md shadow-lg pb-fluid-video"
            >
              <iframe
                className="absolute top-0 left-0 w-full h-full "
                src="https://www.youtube.com/embed/QQBsPOUnxTc"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="YouTube video player"
              ></iframe>
            </div>
          </div>
        </div>
        <div className="flex flex-col-reverse flex-wrap my-12 sm:flex-row ">
          <div className="w-full p-6 mt-6 sm:w-1/2 z-50 ">
            <div
              id="responsiveVideoWrapper"
              className="relative h-0 overflow-hidden rounded-md shadow-lg pb-fluid-video"
            >
              <iframe
                className="absolute top-0 left-0 w-full h-full "
                src="https://www.youtube.com/embed/_VHe1vkYz9M"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="YouTube video player"
              ></iframe>
            </div>
          </div>
          <div className="w-full p-6 mt-6 sm:w-1/2 z-50">
            <div className="align-middle">
              <a
                className="flex flex-row gap-1 pointer hover:no-underline"
                href="/dataperf"
              >
                <h3 className="mb-3 text-3xl font-bold leading-none text-letter-color">
                  Dataperf
                </h3>
              </a>
              <p className="mb-8 text-lg text-gray-600">
                A suite of benchmarks that evaluate the quality of training and
                test data, and the algorithms for constructing or optimizing
                such datasets, such as core set selection or labelling error
                debugging, across a range of common ML tasks such as image
                classification. We plan to leverage the DataPerf benchmarks
                through challenges and leaderboards.
              </p>
              <Button
                className="p-2 text-lg font-semibold border-0 rounded-full bg-primary-color"
                as={Link}
                to="/dataperf"
              >
                Learn more
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap my-12">
          <div className="w-5/6 p-6 sm:w-1/2 z-50">
            <a
              className="flex flex-row gap-1 pointer hover:no-underline"
              href="/babylm"
            >
              <h3 className="mb-3 text-3xl font-bold leading-none text-letter-color">
                BabyLM
              </h3>
            </a>
            <p className="mb-8 text-lg text-gray-600">
              This shared task challenges community members to train a language
              model from scratch on the same amount of linguistic data available
              to a child. Submissions should be implemented in Huggingface's
              Transformers library and will be evaluated on a shared pipeline.
              This shared task is co-sponsored by CMCL and CoNLL.
            </p>
            <Button
              className="p-2 text-lg font-semibold border-0 rounded-full bg-primary-color"
              as={Link}
              to="/babylm"
            >
              Learn more
            </Button>
          </div>
          <div className="w-full p-6 sm:w-1/2">
            <div
              id="responsiveVideoWrapper"
              className="relative h-0 overflow-hidden rounded-md pb-fluid-video"
            >
              <Baby className="absolute top-0 left-0 w-full h-full" />
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse flex-wrap my-12 sm:flex-row">
          <div className="w-full p-6 mt-6 sm:w-1/2 z-50">
            <div
              id="responsiveVideoWrapper"
              className="relative h-0 overflow-hidden rounded-md pb-fluid-video"
            >
              <LLM className="absolute top-0 left-0 w-full h-full" />
            </div>
          </div>
          <div className="w-full p-6 mt-6 sm:w-1/2 z-50">
            <div className="align-middle">
              <a
                className="flex flex-row gap-1 pointer hover:no-underline"
                href="/llms"
              >
                <h3 className="mb-3 text-3xl font-bold leading-none text-letter-color">
                  Large Language Model
                </h3>
              </a>
              <p className="mb-8 text-lg text-gray-600">
                The LLM community on our platform is dedicated to creating
                advanced challenges to evaluate Language Models (LLMs) across
                various tasks, ensuring their performance and capabilities are
                thoroughly assessed. We provide a collaborative space for
                researchers, developers, and enthusiasts to explore and measure
                the effectiveness of LLMs in specific areas such as bias
                creation, domain expertise, and more.
              </p>
              <Button
                className="p-2 text-lg font-semibold border-0 rounded-full bg-primary-color"
                as={Link}
                to="/dataperf"
              >
                Learn more
              </Button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap my-12">
          <div className="w-5/6 p-6 sm:w-1/2 z-50">
            <a
              className="flex flex-row gap-1 pointer hover:no-underline"
              href="/others_tasks"
            >
              <h3 className="mb-3 text-3xl font-bold leading-none text-letter-color">
                Others
              </h3>
            </a>
            <p className="mb-8 text-lg text-gray-600">
              Data from multiple modalities, such as images, text, and audio,
              are frequently encountered in real-world applications. If you have
              a challenge that doesn't fit within our existing communities, you
              are welcome to propose a new community or submit your challenge.
            </p>
            <Button
              className="p-2 text-lg font-semibold border-0 rounded-full bg-primary-color"
              as={Link}
              to="/others_tasks"
            >
              Learn more
            </Button>
          </div>
          <div className="w-full p-6 sm:w-1/2">
            <div
              id="responsiveVideoWrapper"
              className="relative h-0 overflow-hidden rounded-md pb-fluid-video"
            >
              <Other className="absolute top-0 left-0 w-full h-full" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Communities;
