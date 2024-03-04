import React, { useState } from "react";
import Select from "react-select";

type DoubleDropDownProps = {
  filterContext: any;
};

const DoubleDropDown = ({ filterContext }: DoubleDropDownProps) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedConcept, setSelectedConcept] = useState(null);

  const handleCategoryChange = (selectedOption: any) => {
    setSelectedCategory(selectedOption);
    setSelectedConcept(null); // Reset selected concept when category changes
  };

  const handleConceptChange = (selectedOption: any) => {
    setSelectedConcept(selectedOption);
  };

  return (
    <div className="flex flex-col gap-8 px-4">
      <div className="mr-4">
        <p className="text-base">Category</p>
        <Select
          options={filterContext.categories.map((category: any) => ({
            value: category.name,
            label: category.name,
          }))}
          value={selectedCategory}
          onChange={handleCategoryChange}
          placeholder="Select a category"
        />
      </div>
      <div>
        <p className="text-base">Concept</p>
        <Select
          options={
            selectedCategory
              ? filterContext.categories
                  .find(
                    // @ts-ignore
                    (category: any) => category.name === selectedCategory.value,
                  )
                  .concepts.map((concept: any) => ({
                    value: concept,
                    label: concept,
                  }))
              : []
          }
          value={selectedConcept}
          onChange={handleConceptChange}
          placeholder="Select a concept"
          isDisabled={!selectedCategory}
        />
      </div>
    </div>
  );
};

export default DoubleDropDown;
