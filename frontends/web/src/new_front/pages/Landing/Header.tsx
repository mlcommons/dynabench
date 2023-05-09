import React from "react";
import { motion } from "framer-motion";
import { fadeIn } from "new_front/utils/helpers/motion";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Link as ScrollLink } from "react-scroll";

const Header = () => {
  return (
    <>
      <div className="mx-auto ">
        <div className="grid items-center gap-4 lg:grid-cols-2 ">
          <motion.div
            className="mt-12 lg:mt-0"
            variants={fadeIn("right", "tween", 0.5, 0.5)}
          >
            <h2 className="font-sans text-5xl font-bold  text-[#344854]">
              Challenging the Limits of Benchmarking AI
            </h2>
            <p className="mt-4 mb-16 text-xl">
              Collaborate with fellow AI enthusiasts and experts, and work
              together to create new and innovative solutions to the most
              pressing challenges facing the field of AI today.
            </p>
            <Button
              as={Link}
              className="p-3 mr-2 text-xl font-semibold border-0 rounded-full bg-primary-color"
              to="/tasks"
            >
              Challenges
            </Button>
            <Button
              as={Link}
              className="p-3 mr-2 text-xl font-medium border-0 light-gray-bg"
              to="/account#tasks"
            >
              Create your own task
            </Button>
            <div className="flex flex-row w-full gap-16 mt-4">
              <div className="mb-12 md:mb-0">
                <h2 className="text-3xl font-bold display-5 text-[#344854] mb-2">
                  15+
                </h2>
                <h5 className="mb-2 text-lg font-medium">Challenges</h5>
              </div>
              <div className="mb-12 md:mb-0">
                <h2 className="text-3xl font-bold display-5 text-[#344854] mb-2">
                  25+
                </h2>
                <h5 className="mb-2 text-lg font-medium">Partipants</h5>
              </div>
              <div className="mb-12 md:mb-0">
                <h2 className="text-3xl font-bold display-5 text-[#344854] mb-2">
                  30+
                </h2>
                <h5 className="mb-2 text-lg font-medium">Models</h5>
              </div>
            </div>
          </motion.div>
          <div className="mb-12 lg:mb-0">
            <img src="https://i.ibb.co/YPRJ0xL/landing-1.png" alt="" />
          </div>
        </div>
      </div>
      <div className="mt-8">
        <ScrollLink
          to="trusted"
          spy={true}
          smooth={true}
          offset={-70}
          duration={1500}
        >
          <a
            href="/text"
            aria-label="Scroll down"
            className="flex items-center justify-center w-10 h-10 mx-auto text-gray-600 duration-300 transform border border-gray-400 rounded-full hover:text-deep-purple-accent-400 hover:border-deep-purple-accent-400 hover:shadow hover:scale-110"
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
        </ScrollLink>
      </div>
    </>
  );
};

export default Header;
