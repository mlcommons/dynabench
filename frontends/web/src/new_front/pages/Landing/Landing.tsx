import React, { useEffect } from "react";
import Header from "new_front/pages/Landing/Header";
import TrustedBy from "new_front/pages/Landing/TrustedBy";
import Communities from "new_front/pages/Landing/Communities";
import Features from "new_front/pages/Landing/Features";
import { ReactComponent as Layer5 } from "new_front/assets/Layer_5.svg";
import { Parallax } from "react-scroll-parallax";

const Landing = () => {
  useEffect(() => {
    localStorage.setItem("originalPath", "/");
  }, []);

  return (
    <>
      <div className="bg-gradient-to-b from-white to-[#ccebd44d] relative z-50">
        <section id="hero" className="container">
          <Header />
        </section>
      </div>
      <div className="bg-gradient-to-b from-[#ccebd44d] to-[#ccebd466] relative z-50">
        <section id="trusted" className="">
          <TrustedBy />
        </section>
      </div>
      {/* <div className="absolute w-full top-[1600px]">
        <Parallax translateY={[-100, 100]} className="mix-blend-overlay">
          <Layer5 className="mix-blend-overlay" />
        </Parallax>
      </div> */}
      <div className="bg-gradient-to-b from-[#ccebd466] via-[#ccebd41a] to-[#ccebd4b3] z-50">
        <section id="communities" className="pt-16">
          <Communities />
        </section>
        <section id="features" className="container relative z-50">
          <Features />
        </section>
      </div>
    </>
  );
};

export default Landing;
