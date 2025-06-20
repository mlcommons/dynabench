import { motion } from "framer-motion";
import { fadeIn } from "new_front/utils/helpers/motion";
import React from "react";
import { Button } from "react-bootstrap";
import { ReactComponent as Other } from "new_front/assets/other.svg";
import { ReactComponent as LLM } from "new_front/assets/llm.svg";
import { ReactComponent as Baby } from "new_front/assets/baby.svg";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Communities = () => {
  const { t } = useTranslation();

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
            {t("common:homepage.sections.communities")}
          </motion.h2>
        </a>

        <div className="flex flex-wrap my-12">
          <div className="w-5/6 p-6 sm:w-1/2 z-50">
            <a
              className="flex flex-row gap-1 pointer hover:no-underline"
              href="/dadc"
            >
              <h3 className="mb-3 text-3xl font-bold leading-none text-letter-color">
                {t("common:homepage.communities.dynamicalAdversarial.title")}
              </h3>
            </a>
            <p className="mb-8 text-lg text-gray-600">
              {t(
                "common:homepage.communities.dynamicalAdversarial.description",
              )}
            </p>
            <Button
              className="p-2 text-lg font-semibold border-0 rounded-full bg-primary-color"
              as={Link}
              to="/dadc"
            >
              {t("common:buttons.learnMore")}
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
                  {t("common:homepage.communities.dataperf.title")}
                </h3>
              </a>
              <p className="mb-8 text-lg text-gray-600">
                {t("common:homepage.communities.dataperf.description")}
              </p>
              <Button
                className="p-2 text-lg font-semibold border-0 rounded-full bg-primary-color"
                as={Link}
                to="/dataperf"
              >
                {t("common:buttons.learnMore")}
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
                {t("common:homepage.communities.babylm.title")}
              </h3>
            </a>
            <p className="mb-8 text-lg text-gray-600">
              {t("common:homepage.communities.babylm.description")}
            </p>
            <Button
              className="p-2 text-lg font-semibold border-0 rounded-full bg-primary-color"
              as={Link}
              to="/babylm"
            >
              {t("common:buttons.learnMore")}
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
                  {t("common:homepage.communities.llm.title")}
                </h3>
              </a>
              <p className="mb-8 text-lg text-gray-600">
                {t("common:homepage.communities.llm.description")}
              </p>
              <Button
                className="p-2 text-lg font-semibold border-0 rounded-full bg-primary-color"
                as={Link}
                to="/dataperf"
              >
                {t("common:buttons.learnMore")}
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
                {t("common:homepage.communities.others.title")}
              </h3>
            </a>
            <p className="mb-8 text-lg text-gray-600">
              {t("common:homepage.communities.others.description")}
            </p>
            <Button
              className="p-2 text-lg font-semibold border-0 rounded-full bg-primary-color"
              as={Link}
              to="/others_tasks"
            >
              {t("common:buttons.learnMore")}
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
