import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { UserState } from "../../constants/Interfaces";

const initialState: UserState = {
  name: "",
  email: "",
  classes: [],
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUser: (state, action:PayloadAction<UserState>) => {
            state.name = action.payload.name;
            state.email = action.payload.email;
            state.classes = action.payload.classes;
        },
        clearUser: (state) => {
            state.name = "";
            state.email = "";
            state.classes = [];
        },
    }
})

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;