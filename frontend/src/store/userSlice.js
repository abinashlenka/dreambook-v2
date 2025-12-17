// src/store/userSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  name: "",
  email: "",
  isLoggedIn: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    login: (state, action) => {
      state.name = action.payload.name;
      state.id= action.payload._id;
      state.email = action.payload.email;
      state.isLoggedIn = true;
    },
    logout: (state) => {
      state.name = "";
      state.email = "";
      state.isLoggedIn = false;
    },
  },
});

export const { login, logout } = userSlice.actions;
export default userSlice.reducer;
