import React from "react";
import Carousel from "react-multi-carousel";
import {
  responsiveCarouselCompanies,
  companies,
} from "new_front/utils/constants";
import "react-multi-carousel/lib/styles.css";

const TrustedBy = () => {
  return (
    <div className="container mt-16 ">
      <h2 className="w-full my-2 text-5xl font-bold leading-tight text-center text-letter-color">
        Used By
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
              <img src={company.logo} alt={company.name} className="w-48 " />
            </div>
          ))}
        </Carousel>
      </div>
    </div>
  );
};

export default TrustedBy;
