import { motion } from "framer-motion";
import { fadeIn } from "new_front/utils/helpers/motion";
import React from "react";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import Carousel from "react-multi-carousel";
import { responsiveCarouselCompanies } from "../../utils/constants";
import "react-multi-carousel/lib/styles.css";

const Test = () => {
  const companies = [
    {
      name: "Stanford University",
      logo: "https://logodownload.org/wp-content/uploads/2021/04/stanford-university-logo-2.png",
    },
    {
      name: "Harvard University",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Harvard_University_logo.svg/2560px-Harvard_University_logo.svg.png",
    },
    {
      name: "Meta",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Meta_Platforms_Inc._logo.svg/2560px-Meta_Platforms_Inc._logo.svg.png",
    },
    {
      name: "Google",
      logo: "https://logodownload.org/wp-content/uploads/2014/09/google-logo-1.png",
    },
    {
      name: "Coactive",
      logo: "https://s4-recruiting.cdn.greenhouse.io/external_greenhouse_job_boards/logos/400/614/500/original/coactive-logo-rgb-2400px.png?1639152613",
    },
    {
      name: "ETH Zurich",
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/ETH_Z%C3%BCrich_Logo_black.svg/2560px-ETH_Z%C3%BCrich_Logo_black.svg.png",
    },
    {
      name: "Cohere",
      logo: "https://cdn.sanity.io/images/1b1xyaip/production/f5e234e86f931398d5e05f4cdeb8d6dfcd182c7a-102x18.svg",
    },
    {
      name: "Oxford University",
      logo: "https://logodownload.org/wp-content/uploads/2020/12/university-of-oxford-logo-2.png",
    },
  ];
  return (
    <>
      <section id="hero" className="container mt-20">
        <div className="mx-auto">
          <div className="grid lg:grid-cols-2 gap-4 items-center">
            <motion.div
              className="mt-12 lg:mt-0"
              variants={fadeIn("right", "tween", 0.5, 0.5)}
            >
              <h2 className="font-sans text-5xl font-bold  text-[#344854]">
                Challenging the Limits of Benchmarking AI
              </h2>
              <p className="mb-16 text-xl mt-4">
                Collaborate with fellow AI enthusiasts and experts, and work
                together to create new and innovative solutions to the most
                pressing challenges facing the field of AI today.
              </p>
              <Button
                as={Link}
                className="mr-2 border-0 font-semibold text-xl bg-primary-color  p-3 rounded-full"
                to="/tasks"
              >
                Challenges
              </Button>
              <Button
                as={Link}
                className="mr-2 border-0 font-medium light-gray-bg text-xl p-3"
                to="/account#tasks"
              >
                Create your own task
              </Button>
              <div className="flex flex-row w-full gap-16 mt-4">
                <div className="mb-12 md:mb-0">
                  <h2 className="text-3xl font-bold display-5 text-[#344854] mb-2">
                    20+
                  </h2>
                  <h5 className="text-lg font-medium mb-2">Challenges</h5>
                </div>
                <div className="mb-12 md:mb-0">
                  <h2 className="text-3xl font-bold display-5 text-[#344854] mb-2">
                    50+
                  </h2>
                  <h5 className="text-lg font-medium mb-2">Models</h5>
                </div>
                <div className="mb-12 md:mb-0">
                  <h2 className="text-3xl font-bold display-5 text-[#344854] mb-2">
                    50+
                  </h2>
                  <h5 className="text-lg font-medium mb-4">Participants</h5>
                </div>
              </div>
            </motion.div>
            <div className="mb-12 lg:mb-0">
              {/* <img src="https://i.postimg.cc/90DyYQGD/collage-1.png" alt="" /> */}
              {/* <div
                id="responsiveVideoWrapper"
                className="relative h-0 pb-fluid-video overflow-hidden border-hidden rounded-2xl shadow-lg border-transparent	border-0	"
              >
                <iframe
                  className="absolute top-0 left-0 w-full h-full "
                  src="https://models-dynalab.s3.eu-west-3.amazonaws.com/assets/explainer.mp4"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="YouTube video player"
                ></iframe>
              </div> */}
              <div
                id="responsiveVideoWrapper"
                className="relative h-0 pb-fluid-video overflow-hidden rounded-md shadow-lg"
              >
                <iframe
                  className="absolute top-0 left-0 w-full h-full "
                  src="https://s10.gifyu.com/images/ezgif.com-video-to-gif23674cd2ee6b09d5.gif"
                  allow="accelerometer; clipboard-write;  encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="YouTube video player"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8">
          <a
            href="/text"
            aria-label="Scroll down"
            className="flex items-center justify-center w-10 h-10 mx-auto text-gray-600 hover:text-deep-purple-accent-400 hover:border-deep-purple-accent-400 duration-300 transform border border-gray-400 rounded-full hover:shadow hover:scale-110"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="currentColor"
            >
              <path d="M10.293,3.293,6,7.586,1.707,3.293A1,1,0,0,0,.293,4.707l5,5a1,1,0,0,0,1.414,0l5-5a1,1,0,1,0-1.414-1.414Z" />
            </svg>
          </a>
        </div>
      </section>
      <section id="trusted by divide-y">
        <div className=" mt-16 container">
          <h2 className="w-full my-2 text-5xl font-bold leading-tight text-center text-gray-800">
            Trusted by
          </h2>
          <div className="grid grid-cols-1 pt-16">
            <Carousel
              responsive={responsiveCarouselCompanies}
              infinite={true}
              autoPlay={true}
              autoPlaySpeed={4000}
              className="w-full mx-auto"
              arrows={false}
            >
              {companies.map((company) => (
                <div className="flex justify-center px-2 bg-white">
                  <img
                    src={company.logo}
                    alt={company.name}
                    className="w-48 "
                  />
                </div>
              ))}
            </Carousel>
          </div>
        </div>
      </section>
      <section id="communities" className="mt-16">
        <div className="inset-0 flex items-center">
          <div className="w-full border-b border-gray-300"></div>
        </div>
        <div className="container max-w-5xl mx-auto mt-4">
          <motion.h2
            className="w-full my-2 text-5xl font-bold leading-tight text-center text-gray-800 pointer"
            variants={fadeIn("right", "tween", 0.5, 0.5)}
            initial="initial"
            animate="animate"
          >
            Communities
          </motion.h2>

          <div className="flex flex-wrap my-12">
            <div className="w-5/6 sm:w-1/2 p-6">
              <h3 className="text-3xl text-gray-800 font-bold leading-none mb-3">
                Dynamical adversarial
              </h3>
              <p className="text-gray-600 mb-8">
                Dynabench is a platform for dynamic data collection and
                benchmarking. Static benchmarks have many issues. Dynabench
                offers a more accurate and sustainable way for evaluating
                progress in AI.
              </p>
            </div>
            <div className="w-full sm:w-1/2 p-6">
              <div
                id="responsiveVideoWrapper"
                className="relative h-0 pb-fluid-video overflow-hidden rounded-md shadow-lg"
              >
                <iframe
                  className="absolute top-0 left-0 w-full h-full "
                  src="https://models-dynalab.s3.eu-west-3.amazonaws.com/assets/explainer.mp4"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="YouTube video player"
                ></iframe>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap flex-col-reverse sm:flex-row my-12">
            <div className="w-full sm:w-1/2 p-6 mt-6">
              <div
                id="responsiveVideoWrapper"
                className="relative h-0 pb-fluid-video overflow-hidden rounded-md shadow-lg"
              >
                <iframe
                  className="absolute top-0 left-0 w-full h-full "
                  src="https://drive.google.com/file/d/1yrbob0nbViaaZw4iV3gQdYM6NR83fjXU/preview?authuser=0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="YouTube video player"
                ></iframe>
              </div>
            </div>
            <div className="w-full sm:w-1/2 p-6 mt-6">
              <div className="align-middle">
                <h3 className="text-3xl text-gray-800 font-bold leading-none mb-3">
                  Dataperf
                </h3>
                <p className="text-gray-600 mb-8">
                  DataPerf: a suite of benchmarks that evaluate the quality of
                  training and test data, and the algorithms for constructing or
                  optimizing such datasets, such as core set selection or
                  labelling error debugging, across a range of common ML tasks
                  such as image classification. We plan to leverage the DataPerf
                  benchmarks through challenges and leaderboards.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap my-12">
            <div className="w-5/6 sm:w-1/2 p-6">
              <h3 className="text-3xl text-gray-800 font-bold leading-none mb-3">
                Dynamical adversarial
              </h3>
              <p className="text-gray-600 mb-8">
                Dynabench is a platform for dynamic data collection and
                benchmarking. Static benchmarks have many issues. Dynabench
                offers a more accurate and sustainable way for evaluating
                progress in AI.
              </p>
            </div>
            <div className="w-full sm:w-1/2 p-6">
              <div
                id="responsiveVideoWrapper"
                className="relative h-0 pb-fluid-video overflow-hidden rounded-md shadow-lg"
              >
                <iframe
                  className="absolute top-0 left-0 w-full h-full "
                  src="https://drive.google.com/file/d/1fOSlRhkkiM0rmZDkWUnrG_zDfLMVo08D/view"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="YouTube video player"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="features">
        <h2 className="text-3xl font-bold mb-12 text-center">
          Why is it so great?
        </h2>

        <div className="flex flex-wrap items-center">
          <div className="grow-0 shrink-0 basis-auto w-full lg:w-5/12 mb-12 lg:mb-0 md:px-6">
            <div
              className="relative overflow-hidden bg-no-repeat bg-cover rounded-lg shadow-lg"
              data-mdb-ripple="true"
              data-mdb-ripple-color="light"
            >
              <img
                src="https://mdbootstrap.com/img/new/textures/full/98.jpg"
                className="w-full"
                alt=""
              />
            </div>
          </div>

          <div className="grow-0 shrink-0 basis-auto w-full lg:w-7/12 md:px-6">
            <div className="flex mb-12">
              <div className="shrink-0">
                <div className="p-4 rounded-md shadow-lg">
                  <svg
                    className="w-5 h-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                  >
                    <path
                      fill="currentColor"
                      d="M192 208c0-17.67-14.33-32-32-32h-16c-35.35 0-64 28.65-64 64v48c0 35.35 28.65 64 64 64h16c17.67 0 32-14.33 32-32V208zm176 144c35.35 0 64-28.65 64-64v-48c0-35.35-28.65-64-64-64h-16c-17.67 0-32 14.33-32 32v112c0 17.67 14.33 32 32 32h16zM256 0C113.18 0 4.58 118.83 0 256v16c0 8.84 7.16 16 16 16h16c8.84 0 16-7.16 16-16v-16c0-114.69 93.31-208 208-208s208 93.31 208 208h-.12c.08 2.43.12 165.72.12 165.72 0 23.35-18.93 42.28-42.28 42.28H320c0-26.51-21.49-48-48-48h-32c-26.51 0-48 21.49-48 48s21.49 48 48 48h181.72c49.86 0 90.28-40.42 90.28-90.28V256C507.42 118.83 398.82 0 256 0z"
                    ></path>
                  </svg>
                </div>
              </div>
              <div className="grow ml-4">
                <p className="font-bold mb-1">Support 24/7</p>
                <p className="text-gray-500">
                  Lorem ipsum dolor, sit amet consectetur adipisicing elit.
                  Nihil quisquam quibusdam modi sapiente magni molestias
                  pariatur facilis reprehenderit facere aliquam ex.
                </p>
              </div>
            </div>

            <div className="flex mb-12">
              <div className="shrink-0">
                <div className="p-4 rounded-md shadow-lg">
                  <svg
                    className="w-5 h-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                  >
                    <path
                      fill="currentColor"
                      d="M466.5 83.7l-192-80a48.15 48.15 0 0 0-36.9 0l-192 80C27.7 91.1 16 108.6 16 128c0 198.5 114.5 335.7 221.5 380.3 11.8 4.9 25.1 4.9 36.9 0C360.1 472.6 496 349.3 496 128c0-19.4-11.7-36.9-29.5-44.3zM256.1 446.3l-.1-381 175.9 73.3c-3.3 151.4-82.1 261.1-175.8 307.7z"
                    ></path>
                  </svg>
                </div>
              </div>
              <div className="grow ml-4">
                <p className="font-bold mb-1">Safe and solid</p>
                <p className="text-gray-500">
                  Eum nostrum fugit numquam, voluptates veniam neque quibusdam
                  ullam aspernatur odio soluta, quisquam dolore animi mollitia a
                  omnis praesentium, expedita nobis!
                </p>
              </div>
            </div>

            <div className="flex mb-12">
              <div className="shrink-0">
                <div className="p-4 rounded-md shadow-lg">
                  <svg
                    className="w-5 h-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 640 512"
                  >
                    <path
                      fill="currentColor"
                      d="M624 352h-16V243.9c0-12.7-5.1-24.9-14.1-33.9L494 110.1c-9-9-21.2-14.1-33.9-14.1H416V48c0-26.5-21.5-48-48-48H112C85.5 0 64 21.5 64 48v48H8c-4.4 0-8 3.6-8 8v16c0 4.4 3.6 8 8 8h272c4.4 0 8 3.6 8 8v16c0 4.4-3.6 8-8 8H40c-4.4 0-8 3.6-8 8v16c0 4.4 3.6 8 8 8h208c4.4 0 8 3.6 8 8v16c0 4.4-3.6 8-8 8H8c-4.4 0-8 3.6-8 8v16c0 4.4 3.6 8 8 8h208c4.4 0 8 3.6 8 8v16c0 4.4-3.6 8-8 8H64v128c0 53 43 96 96 96s96-43 96-96h128c0 53 43 96 96 96s96-43 96-96h48c8.8 0 16-7.2 16-16v-32c0-8.8-7.2-16-16-16zM160 464c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zm320 0c-26.5 0-48-21.5-48-48s21.5-48 48-48 48 21.5 48 48-21.5 48-48 48zm80-208H416V144h44.1l99.9 99.9V256z"
                    ></path>
                  </svg>
                </div>
              </div>
              <div className="grow ml-4">
                <p className="font-bold mb-1">Extremely fast</p>
                <p className="text-gray-500">
                  Enim cupiditate, minus nulla dolor cumque iure eveniet facere
                  ullam beatae hic voluptatibus dolores exercitationem? Facilis
                  debitis aspernatur amet nisi iure eveniet facere?
                </p>
              </div>
            </div>

            <div className="flex">
              <div className="shrink-0">
                <div className="p-4 rounded-md shadow-lg">
                  <svg
                    className="w-5 h-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 544 512"
                  >
                    <path
                      fill="currentColor"
                      d="M527.79 288H290.5l158.03 158.03c6.04 6.04 15.98 6.53 22.19.68 38.7-36.46 65.32-85.61 73.13-140.86 1.34-9.46-6.51-17.85-16.06-17.85zm-15.83-64.8C503.72 103.74 408.26 8.28 288.8.04 279.68-.59 272 7.1 272 16.24V240h223.77c9.14 0 16.82-7.68 16.19-16.8zM224 288V50.71c0-9.55-8.39-17.4-17.84-16.06C86.99 51.49-4.1 155.6.14 280.37 4.5 408.51 114.83 513.59 243.03 511.98c50.4-.63 96.97-16.87 135.26-44.03 7.9-5.6 8.42-17.23 1.57-24.08L224 288z"
                    ></path>
                  </svg>
                </div>
              </div>
              <div className="grow ml-4">
                <p className="font-bold mb-1">Live analytics</p>
                <p className="text-gray-500">
                  Illum doloremque ea, blanditiis sed dolor laborum praesentium
                  maxime sint, consectetur atque ipsum ab adipisci ullam
                  aspernatur odio soluta, quisquam dolore
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Test;
