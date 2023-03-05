import { ContextConfigType } from "new_front/types/createSamples/annotationContext";
import { ContextAnnotationFactoryType } from "new_front/types/createSamples/annotationFactory";
import React, { FC, useState } from "react";
import { Button, FormControl } from "react-bootstrap";

const SelectBetweenImages: FC = () => {
  const [first, setfirst] = useState<string>();
  const images = [
    "https://www.simplilearn.com/ice9/free_resources_article_thumb/what_is_image_Processing.jpg",
    "https://www.simplilearn.com/ice9/free_resources_article_thumb/what_is_image_Processing.jpg",
    "https://www.simplilearn.com/ice9/free_resources_article_thumb/what_is_image_Processing.jpg",
    "https://www.simplilearn.com/ice9/free_resources_article_thumb/what_is_image_Processing.jpg",
    "https://www.simplilearn.com/ice9/free_resources_article_thumb/what_is_image_Processing.jpg",
    "https://www.simplilearn.com/ice9/free_resources_article_thumb/what_is_image_Processing.jpg",
    "https://www.simplilearn.com/ice9/free_resources_article_thumb/what_is_image_Processing.jpg",
    "https://www.simplilearn.com/ice9/free_resources_article_thumb/what_is_image_Processing.jpg",
    "https://www.simplilearn.com/ice9/free_resources_article_thumb/what_is_image_Processing.jpg",
  ];
  return (
    <div>
      <FormControl
        className="p-3 h-12 rounded-1 thick-border bg-[#f0f2f5]"
        placeholder="Enter prompt"
        required={true}
      />
      <Button
        className="p-4 bg-green-100 border-0 font-weight-bold light-gray-bg task-action-btn"
        onClick={() => setfirst("ciro")}
      >
        Generate images
      </Button>

      {first && (
        <div className="grid grid-cols-3 gap-3 p-4">
          {images.map((image, index) => (
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
      )}
    </div>
  );
};

export default SelectBetweenImages;
