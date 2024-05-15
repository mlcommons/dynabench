import React, { useEffect, useState } from "react";
import Select from "react-select";

type DoubleDropDownProps = {
  filterContext: any;
  selectedCategory: any;
  setSelectedCategory: any;
  selectedConcept: any;
  setSelectedConcept: any;
  updateModelInputs: (input: object, metadata?: boolean) => void;
};

const DoubleDropDown = ({
  filterContext,
  selectedCategory,
  setSelectedCategory,
  selectedConcept,
  setSelectedConcept,
  updateModelInputs,
}: DoubleDropDownProps) => {
  const handleCategoryChange = (selectedOption: any) => {
    setSelectedCategory(selectedOption);
    updateModelInputs({ category: selectedOption.value });
    setSelectedConcept(null);
  };

  const handleConceptChange = (selectedOption: any) => {
    updateModelInputs({ concept: selectedOption.value });
    setSelectedConcept(selectedOption);
  };

  useEffect(() => {
    if (selectedCategory) {
      localStorage.setItem(
        "selectedCategory",
        selectedCategory ? JSON.stringify(selectedCategory) : "",
      );
    }
    if (selectedConcept) {
      localStorage.setItem(
        "selectedConcept",
        selectedConcept ? JSON.stringify(selectedConcept) : "",
      );
    }
  }, [selectedCategory, selectedConcept]);

  const actualCategory = localStorage.getItem("selectedCategory")
    ? JSON.parse(localStorage.getItem("selectedCategory") || "")
    : null;
  const actualConcept = localStorage.getItem("selectedConcept")
    ? JSON.parse(localStorage.getItem("selectedConcept") || "")
    : null;

  return (
    <>
      {filterContext && (
        <div className="flex flex-row gap-8 px-4">
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
              defaultValue={
                actualCategory && {
                  value: actualCategory.value,
                  label: actualCategory.label,
                }
              }
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
              defaultValue={
                actualConcept && {
                  value: actualConcept.value,
                  label: actualConcept.label,
                }
              }
            />
          </div>
        </div>
      )}
    </>
  );
};

export default DoubleDropDown;
