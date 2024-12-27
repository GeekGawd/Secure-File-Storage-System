import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/store/auth/authSlice";
import { apiSlice } from "@/api";

export const store = configureStore({
    reducer: {
        [apiSlice.reducerPath]: apiSlice.reducer,
        auth: authReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(apiSlice.middleware),
    devTools: true
});



export type RootState = ReturnType<typeof store.getState>