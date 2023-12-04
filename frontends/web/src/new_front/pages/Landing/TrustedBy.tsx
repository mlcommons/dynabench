import React from "react";
import Carousel from "react-multi-carousel";
import {
  responsiveCarouselCompanies,
  companies,
} from "new_front/utils/constants";
import "react-multi-carousel/lib/styles.css";

const TrustedBy = () => {
  return (
    <div className="container pt-4">
      <h2 className="w-full my-2 text-5xl font-bold leading-tight text-center text-letter-color">
        Used By
      </h2>
      <div className="grid content-center grid-cols-1 pt-8 jitems-center">
        <Carousel
          responsive={responsiveCarouselCompanies}
          infinite={true}
          autoPlay={true}
          autoPlaySpeed={4000}
          className="w-full mx-auto"
          arrows={false}
        >
          {companies.map((company, key) => (
            <div
              className="flex items-baseline content-center justify-center px-4 bg-transparent"
              key={key}
            >
              <img
                src={company.logo}
                alt={company.name}
                className="bg-transparent w-52"
              />
            </div>
          ))}
        </Carousel>
      </div>
    </div>
  );
};

export default TrustedBy;
