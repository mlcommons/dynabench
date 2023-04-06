import React from "react";
import { Button } from "react-bootstrap";
import { Link } from "react-router-dom";

const Test = () => {
  return (
    <section id="hero">
      <div className="px-6 py-12 md:px-12 bg-gray-50 text-gray-800 text-center lg:text-left">
        <div className="container mx-auto xl:px-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="mt-12 lg:mt-0">
              <h1 className="text-6xl text-letter-color mb-6">
                Real-World Data Centric <br />
                <span className="text-third-color">Benchmarking</span>
              </h1>
              <p className="mb-12 text-xl">
                We provide a platform for benchmarking your models on real-world
                data.
              </p>
              <Button
                as={Link}
                className="mr-2 border-0 font-weight-bold light-gray-bg"
                to="/tasks"
              >
                Our Tasks
              </Button>
              <Button
                as={Link}
                className="mr-2 border-0 font-weight-bold light-gray-bg"
                to="/account#tasks"
              >
                Create your own Task
              </Button>
            </div>
            <div className="mb-12 lg:mb-0">
              <img
                src="https://mdbootstrap.com/img/new/ecommerce/vertical/028.jpg"
                className="w-full rounded-lg shadow-lg"
                alt=""
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Test;
