import { ValidationContext } from "new_front/types/createSamples/validateSamples/validationContext";
import { ValidationFactoryType } from "new_front/types/createSamples/validateSamples/validationFactory";
import React, { FC, useEffect, useState } from "react";
import useFetch from "use-http";

const ImageS3: FC<ValidationFactoryType & ValidationContext> = ({
  label,
  info,
  bucket,
}) => {
  const [image, setImage] = useState<any>();
  const { post, response } = useFetch();

  useEffect(() => {
    // const getImage = async () => {
    //   const image = await post(`/example/convert_s3_image_to_base_64`, {
    //     image_name: info,
    //     bucket_name: bucket,
    //   })
    //   if (response.ok) {
    //     setImage(image)
    //   }
    // }
    // getImage()
    console.log("bucket", bucket);
    console.log("info", info);
  }, [info]);

  return (
    <>
      {info && (
        <div className="py-1">
          <div className="text-base text-[#005798] font-bold normal-case ">
            {label!.replace("_", " ")}
          </div>
        </div>
      )}
    </>
  );
};

export default ImageS3;
