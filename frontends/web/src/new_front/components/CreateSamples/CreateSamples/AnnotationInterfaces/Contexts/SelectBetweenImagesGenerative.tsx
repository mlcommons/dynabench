import {
  ContextConfigType,
  GenerativeContext,
} from "new_front/types/createSamples/annotationContext";
import { ContextAnnotationFactoryType } from "new_front/types/createSamples/annotationFactory";
import React, { FC, useState } from "react";
import { Button, FormControl } from "react-bootstrap";
import useFetch from "use-http";

const SelectBetweenImagesGenerative: FC<
  ContextAnnotationFactoryType & ContextConfigType
> = (onInputChange) => {
  const type = "nibler";
  const artifacts = {
    endpoint: "",
  };

  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [artifactsInput, setArtifactsInput] = useState<object>(artifacts);
  const { post, response, loading } = useFetch();

  const generateImages = async () => {
    const generatedImages = await post("/context/generate_images", {
      type: type,
      artifacts: artifacts,
    });
    if (response.ok) {
      setGeneratedImages(generatedImages);
    }
  };

  const [first, setfirst] = useState<string>();

  return (
    <div>
      <FormControl
        className="p-3 h-12 rounded-1 thick-border bg-[#f0f2f5]"
        placeholder="Enter prompt"
        onChange={(e) => {
          setArtifactsInput({ ...artifactsInput, prompt: e.target.value });
        }}
        required={true}
      />
      <div className="py-3 grid col-span-1 justify-items-end	">
        <Button
          className="border-0 font-weight-bold light-gray-bg task-action-btn bg-white"
          onClick={generateImages}
        >
          Generate images
        </Button>
      </div>

      {generatedImages && (
        <div>
          <div className="grid grid-cols-3 gap-3 p-4">
            {generatedImages.map((image, index) => (
              <div key={index}>
                <img
                  height={240}
                  width={240}
                  src={image}
                  className="hover:scale-[2.7]"
                  alt="src"
                ></img>
                <input
                  id="checkbox"
                  type="checkbox"
                  value=""
                  className="items-center "
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectBetweenImagesGenerative;
