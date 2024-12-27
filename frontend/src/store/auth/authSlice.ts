import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/store";

interface AuthState {
    user: any;
    accessToken: string;
}

const authSlice = createSlice({
    name: "auth",
    initialState: {} as AuthState,
    reducers: {
        setCredentials: (state, action) => {
            state.user = action.payload.user;
            state.accessToken = action.payload.accessToken;
            // set user in local storage
            if(state.user) {
                localStorage.setItem("user", JSON.stringify(state.user));
            }
        },
        logOut: (state) => {
            state.user = null;
            state.accessToken = null;
            // remove user from local storage
            localStorage.removeItem("user");
        }
    },
});

export const { setCredentials, logOut } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentUser = (state: RootState) => state?.auth?.user;
export const selectCurrentAccessToken = (state: RootState) => state?.auth?.accessToken;