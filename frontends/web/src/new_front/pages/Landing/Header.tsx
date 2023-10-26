import React, { FC, useState } from "react";
import { motion } from "framer-motion";
import { fadeIn } from "new_front/utils/helpers/motion";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Link as ScrollLink } from "react-scroll";
import Modal from "react-bootstrap/Modal";
import CreateProposalTask from "new_front/components/Modals/CreateProposalTask";

const Header: FC = () => {
  const [showProposeTask, setShowProposeTask] = useState(false);
  const handleClose = () => setShowProposeTask(false);
  const handleShow = () => setShowProposeTask(true);

  return (
    <>
      <Modal show={showProposeTask} onHide={handleClose}>
        <CreateProposalTask handleClose={handleClose} />
      </Modal>
      <div className="flex flex-col items-center justify-center w-full pt-2">
        <div className="flex flex-col items-center justify-center px-4 md:w-9/12 lg:flex-row lg:px-0">
          <motion.div
            className="md:mt-12"
            variants={fadeIn("right", "tween", 0.5, 0.5)}
          >
            <div className="flex items-center justify-center flex-column">
              <h2 className="font-sans text-4xl font-bold text-center lg:text-5xl text-letter-color">
                Challenging the Limits of Benchmarking AI
              </h2>
              <p className="items-center mt-4 mb-8 text-xl font-medium text-center lg:text-2xl">
                Collaborate with AI enthusiasts and experts to tackle vital AI
                challenges. Dynabench lets you create and join AI challenges,
                enhancing skills and advancing AI together.
              </p>
            </div>
            <div className="flex items-center justify-center">
              <div className="grid items-center justify-center grid-cols-1 gap-6 md:grid-cols-2">
                <Button
                  as={Link}
                  className="max-w-sm py-2 text-lg font-semibold border-0 px-7 lg:text-xl bg-primary-color"
                  to="/tasks"
                >
                  Challenges
                </Button>
                <Button
                  as="div"
                  onClick={handleShow}
                  className="py-2 text-lg font-semibold border-0 px-7 lg:text-xl light-gray-bg"
                >
                  Create your own challenge
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4">
              <div className="mb-4 text-center lg:mb-12 md:mb-0">
                <h2 className="mb-2 text-2xl font-bold lg:text-3xl display-5 text-letter-color">
                  20+
                </h2>
                <h5 className="mb-2 text-xl font-medium">Challenges</h5>
              </div>
              <div className="mb-4 text-center lg:mb-12 md:mb-0">
                <h2 className="mb-2 text-2xl font-bold lg:text-3xl display-5 text-letter-color">
                  40+
                </h2>
                <h5 className="mb-2 text-xl font-medium">Partipants</h5>
              </div>
              <div className="mb-4 text-center lg:mb-12 md:mb-0">
                <h2 className="mb-2 text-2xl font-bold lg:text-3xl display-5 text-letter-color">
                  100+
                </h2>
                <h5 className="mb-2 text-xl font-medium">Models</h5>
              </div>
              <div className="mb-4 text-center lg:mb-12 md:mb-0">
                <h2 className="mb-2 text-2xl font-bold text-center lg:text-3xl display-5 text-letter-color">
                  6
                </h2>
                <h5 className="mb-2 text-xl font-medium">Communities</h5>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <div className="mt-8">
        <ScrollLink
          to="trusted"
          spy={true}
          smooth={true}
          offset={-70}
          duration={1500}
          className="flex items-center justify-center w-10 h-10 mx-auto text-gray-600 duration-300 transform border border-gray-400 rounded-full hover:text-deep-purple-accent-400 hover:border-deep-purple-accent-400 hover:shadow hover:scale-110 pointer"
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
        </ScrollLink>
      </div>
    </>
  );
};

export default Header;
