import { Reducer, configureStore } from "@reduxjs/toolkit";
import { language } from "./language";
import ManagementReducer from "./license-management/reducer";

export const store = configureStore({
  reducer: {
    language: language.reducer,
    // more
    management: ManagementReducer as Reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
