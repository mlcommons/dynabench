import React from "react";
import Header from "new_front/pages/Landing/Header";
import TrustedBy from "new_front/pages/Landing/TrustedBy";
import Communities from "new_front/pages/Landing/Communities";
import Features from "new_front/pages/Landing/Features";

const Landing = () => {
  return (
    <>
      <section id="hero" className="container mt-20">
        <Header />
      </section>
      <section id="trusted" className="">
        <TrustedBy />
      </section>
      <div className="bg-gray-50">
        <section id="communities" className="mt-16">
          <Communities />
        </section>
      </div>
      <section id="features" className="container">
        <Features />
      </section>
    </>
  );
};

export default Landing;
