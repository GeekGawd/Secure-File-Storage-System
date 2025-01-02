import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/store/auth/authSlice";
import { apiSlice } from "@/api";
import fileReducer from "@/store/files/fileSlice";


export const store = configureStore({
    reducer: {
        [apiSlice.reducerPath]: apiSlice.reducer,
        auth: authReducer,
        files: fileReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(apiSlice.middleware),
    devTools: true
});



export type RootState = ReturnType<typeof store.getState>