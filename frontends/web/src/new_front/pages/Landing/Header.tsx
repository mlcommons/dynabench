import React, { FC, useState } from "react";
import { motion } from "framer-motion";
import { fadeIn } from "new_front/utils/helpers/motion";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Link as ScrollLink } from "react-scroll";
import Landing1 from "new_front/assets/landing-1.png";
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
      <div className="mx-auto pt-16">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <motion.div
            className="mt-12 lg:mt-0"
            variants={fadeIn("right", "tween", 0.5, 0.5)}
          >
            <h2 className="font-sans text-5xl font-bold  text-letter-color text-center">
              Challenging the Limits of Benchmarking AI
            </h2>
            <p className="mt-4 mb-16 text-2xl text-center font-medium">
              Collaborate with AI enthusiasts and experts to solve pressing AI
              challenges through innovation.
            </p>
            <div className="flex flex-row items-center justify-center gap-6">
              <Button
                as={Link}
                className="py-[9px] px-7 text-xl font-semibold border-0 bg-primary-color "
                to="/tasks"
              >
                Challenges
              </Button>
              <Button
                as="div"
                onClick={handleShow}
                className="py-[9px] px-7 text-xl font-semibold  border-0 light-gray-bg"
              >
                Create your own task
              </Button>
            </div>
            <div className="flex flex-row w-full gap-12 mt-4 mx-4">
              <div className="mb-12 md:mb-0 text-center">
                <h2 className="text-3xl font-bold display-5 text-letter-color mb-2">
                  20+
                </h2>
                <h5 className="mb-2 text-lg font-medium">Challenges</h5>
              </div>
              <div className="mb-12 md:mb-0 text-center">
                <h2 className="text-3xl font-bold display-5 text-letter-color mb-2">
                  40+
                </h2>
                <h5 className="mb-2 text-lg font-medium">Partipants</h5>
              </div>
              <div className="mb-12 md:mb-0 text-center">
                <h2 className="text-3xl font-bold display-5 text-letter-color mb-2">
                  100+
                </h2>
                <h5 className="mb-2 text-lg font-medium">Models</h5>
              </div>
              <div className="mb-12 md:mb-0 text-center">
                <h2 className="text-3xl font-bold display-5 text-letter-color mb-2 text-center">
                  6
                </h2>
                <h5 className="mb-2 text-lg font-medium">Communities</h5>
              </div>
            </div>
          </motion.div>
          <div className="p-4">
            <img
              className="object-cover w-full h-full"
              src={Landing1}
              alt="Landing"
            />
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
