import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { UserState } from "../../constants/Interfaces";

const initialState: UserState = {
  id: null,
  username: "",
  email: "",
  role: "",
  classes: [],
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUser: (state, action:PayloadAction<UserState>) => {
            state.id = action.payload.id;
            state.username = action.payload.username;
            state.email = action.payload.email;
            state.role = action.payload.role;
            state.classes = action.payload.classes;
        },
        clearUser: (state) => {
            state.id = null;
            state.username = "";
            state.email = "";
            state.role = "";
            state.classes = [];
        },
    }
})

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
