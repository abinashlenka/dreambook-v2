// src/store/paginationSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  page: 1,
  limit: 10,
};

const paginationSlice = createSlice({
  name: "pagination",
  initialState,
  reducers: {
    setPage: (state, action) => {
      state.page = action.payload;
    },
    setLimit: (state, action) => {
      state.limit = action.payload;
    },
    resetPagination: (state) => {
      state.page = 1;
      state.limit = 10;
    },
  },
});

export const { setPage, setLimit, resetPagination } = paginationSlice.actions;
export default paginationSlice.reducer;
