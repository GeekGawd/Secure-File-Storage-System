import { apiSlice } from '@/api';
import { ApiResponse } from '@/api';

export interface JwtTokenObtainPair {
    access: string;
    user: string;
}

export interface LoginRedirect {
    redirect_url: string;
    access: string;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface TotpCreateCredentials {
    url: string;
}

export interface TotpVerifyResponse {
    access: string;
}

export interface TotpVerifyBody {
    token: string;
}


export const authApi = apiSlice.injectEndpoints({
    endpoints: builder => ({
        login: builder.mutation<ApiResponse<JwtTokenObtainPair> | ApiResponse<LoginRedirect>, LoginCredentials>({
            query: (body) => ({
                url: '/auth/login/',
                method: 'POST',
                body: { ...body }
            }),
        }),
        refreshToken: builder.mutation<ApiResponse<JwtTokenObtainPair>, void>({
            query: () => ({
                url: '/auth/refresh/',
                method: 'POST',
            })
        }),
        totpCreate: builder.mutation<ApiResponse<TotpCreateCredentials>, void>({
            query: () => ({
                url: '/auth/totp/create/',
                method: 'GET',
            })
        }),
        totpVerify: builder.mutation<ApiResponse<TotpVerifyResponse>, TotpVerifyBody>({
            query: (body) => ({
                url: '/auth/totp/verify/',
                method: 'POST',
                body: { ...body }
            })
        }),
    })
})

export const { useLoginMutation, useRefreshTokenMutation, useTotpCreateMutation, useTotpVerifyMutation } = authApi;