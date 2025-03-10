import React from "react";
import Select from "react-select";
import { useDispatch, useSelector } from "react-redux";
import { updateCategory, updateConcept } from "state/wonders/wondersSlice";
import { RootState } from "state/store";

type DoubleDropDownProps = {
  filterContext: any;
  updateModelInputs: (input: object, metadata?: boolean) => void;
};

const DoubleDropDown = ({
  filterContext,
  updateModelInputs,
}: DoubleDropDownProps) => {
  const dispatch = useDispatch();
  const selectedCategory = useSelector(
    (state: RootState) => state.wonders.selectedCategory
  );
  const selectedConcept = useSelector(
    (state: RootState) => state.wonders.selectedConcept
  );

  const handleCategoryChange = (selectedOption: any) => {
    updateModelInputs({ category: selectedOption.value });
    dispatch(updateCategory(selectedOption));
    dispatch(updateConcept(null));
  };

  const handleConceptChange = (selectedOption: any) => {
    updateModelInputs({ concept: selectedOption.value });
    dispatch(updateConcept(selectedOption));
  };

  return (
    <>
      {filterContext && (
        <div className="grid grid-cols-2 flex flex-col h-full gap-4 px-2">
          <div className="mr-4 ">
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
                selectedCategory && {
                  value: selectedCategory.value,
                  label: selectedCategory.label,
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
                          category.name === selectedCategory.value
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
                selectedConcept && {
                  value: selectedConcept.value,
                  label: selectedConcept.label,
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
