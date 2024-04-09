import React, { useState } from "react";
import Select from "react-select";

type DoubleDropDownProps = {
  filterContext: any;
  updateModelInputs: (input: object, metadata?: boolean) => void;
};

const DoubleDropDown = ({
  filterContext,
  updateModelInputs,
}: DoubleDropDownProps) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedConcept, setSelectedConcept] = useState(null);

  const handleCategoryChange = (selectedOption: any) => {
    setSelectedCategory(selectedOption);
    updateModelInputs({ category: selectedOption.value });
    setSelectedConcept(null);
  };

  const handleConceptChange = (selectedOption: any) => {
    updateModelInputs({ concept: selectedOption.value });
    setSelectedConcept(selectedOption);
  };

  return (
    <>
      {filterContext && (
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
                        (category: any) =>
                          // @ts-ignore
                          category.name === selectedCategory.value,
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
      )}
    </>
  );
};

export default DoubleDropDown;
