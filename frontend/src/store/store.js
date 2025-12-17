// src/store/store.js
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import paginationReducer from "./paginationSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    pagination: paginationReducer,
  },
});
