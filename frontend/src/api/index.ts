import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '@/store';
import { logOut, setCredentials, selectCurrentAccessToken } from '@/store/auth/authSlice';

const BASE_URL = 'http://localhost:8000/api/v1';

const baseQuery = fetchBaseQuery({
    baseUrl: BASE_URL,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
        const accessToken = selectCurrentAccessToken(getState() as RootState);
        if (accessToken) {
            headers.set('Authorization', `Bearer ${accessToken}`);
        }
        return headers;
    },
});

/**
 * Base query that handles token refresh logic
 */
const baseQueryPrivate = async (args, api, extraOptions) => {
    // Send query to server
    let result = await baseQuery(args, api, extraOptions);

    // If the query returns a 401, we need to refresh the token
    if(result?.error?.status === 401) {
        const refreshResponse = await baseQuery(`/auth/refresh`, api, extraOptions);
        if(refreshResponse?.data){
            // store the new access token
            const refreshData = refreshResponse.data as Record<string, any>;
            const accessToken = refreshData.data?.access;
            const user = refreshData.data?.user;
            api.dispatch(setCredentials({ user: user, accessToken: accessToken }));
            // retry the original query
            result = await baseQuery(args, api, extraOptions);
        }
        else{
            api.dispatch(logOut());
        }
    }

    return result;
}

export const apiSlice = createApi({
    baseQuery: baseQueryPrivate,
    endpoints: () => ({})
})

export interface ApiResponse<T> {
    message: string;
    data: T;
    status_code: number;
    status: boolean;
}