import { ValidationContext } from "new_front/types/createSamples/validateSamples/validationContext";
import { ValidationFactoryType } from "new_front/types/createSamples/validateSamples/validationFactory";
import React, { FC, useEffect, useState } from "react";
import useFetch from "use-http";

const ImageS3: FC<ValidationFactoryType & ValidationContext> = ({
  label,
  info,
  bucket,
  folder,
}) => {
  const [image, setImage] = useState<any>();
  const { post, response } = useFetch();

  useEffect(() => {
    const getImage = async () => {
      const image = await post(`/example/convert_s3_image_to_base_64`, {
        image_name: `${folder}/${info}.jpeg`,
        bucket_name: bucket,
      });
      if (response.ok) {
        setImage(image);
      }
    };
    getImage();
  }, [info]);

  return (
    <>
      {info && (
        <div className="py-1">
          <div className="text-lg text-[#005798] font-bold normal-case pb-4">
            {label!.charAt(0).toUpperCase() + label!.slice(1).replace("_", " ")}
          </div>
          <div className="flex justify-center">
            <img
              height={240}
              width={240}
              src={`data:image/jpeg;base64,${image}`}
              className={`scale-[1] rounded-lg pb-2`}
              alt="src"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ImageS3;
