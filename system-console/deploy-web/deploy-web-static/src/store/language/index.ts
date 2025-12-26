import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { InitialState } from "./declare";

// https://redux-toolkit.js.org/tutorials/quick-start

const initialState: InitialState = "zh-cn";

export const language = createSlice({
    name: "language",
    initialState,
    reducers: {
        getLanguage: (state) => {
            return state;
        },
        setLanguage: (state, action: PayloadAction<InitialState>) => {
            return (state = action.payload);
        },
    },
});

export const { getLanguage, setLanguage } = language.actions;
