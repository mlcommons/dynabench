import { createSlice } from "@reduxjs/toolkit";

interface wondersState {
  country: string;
  language: string | null;
  selectedCategory?: { value: string; label: string } | null;
  selectedConcept?: { value: string; label: string } | null;
}

const initialState: wondersState = {
  country: "",
  language: null,
  selectedCategory: null,
  selectedConcept: null,
};

const wonderSlice = createSlice({
  name: "wonders",
  initialState,
  reducers: {
    updateCountry: (state, action) => {
      state.country = action.payload;
    },
    updatelanguage: (state, action) => {
      state.language = action.payload;
    },
    updateCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },
    updateConcept: (state, action) => {
      state.selectedConcept = action.payload;
    },
    resetCategoryAndConcept: (state) => {
      state.selectedCategory = null;
      state.selectedConcept = null;
    },
    resetAllButCountry: (state) => {
      state.language = null;
      state.selectedCategory = null;
      state.selectedConcept = null;
    },
  },
});

export const {
  updateCountry,
  updatelanguage,
  updateCategory,
  updateConcept,
  resetAllButCountry,
  resetCategoryAndConcept,
} = wonderSlice.actions;

export default wonderSlice.reducer;
