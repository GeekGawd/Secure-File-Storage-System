import { apiSlice } from '@/api';
import { ApiResponse } from '@/api';

export interface ListFilesResponse {
    external_id: string;
    file_name: string;
    created_at: string;
    updated_at: string;
    global_permission_type: string;
}

export interface UploadFileFormData {
    file: File;
    file_name: string;
    encrypted_key: string;
}

export interface ShareLinkResponse {
    external_id: string;
    file: string;
    expires_at: string | null;
    view_count_limit: number;
    view_count: number;
    created_at: string;
    updated_at: string;
}

export interface UserAutocompleteResponse {
    email: string;
    external_id: string;
}

export interface FileUserPermissionListResponse {
    file: string;
    user: string;
    permission_type: string;
    email: string;
}


export type PermissionType = 'read' | 'download' | 'all';

export interface FileUserPermissionCreateUpdateBody {
    file: string;
    user: string;
    permission_type: PermissionType;
}

export interface FileUserPermissionDeleteBody {
    file: string;
    user: string;
}

export interface ShareLinkCreateBody {
    file: string;
    view_count_limit: number;
    expires_at: string; // ISO 8601 format
}

export interface GlobalPermissionUpdateBody {
    external_id: string;
    global_permission_type: PermissionType;
}

export interface GlobalPermissionUpdateResponse {
    global_permission_type: PermissionType;
}



export const filesApi = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        listFiles: builder.query<ApiResponse<ListFilesResponse[]>, void>({
            query: () => '/files/user/list/',
        }),
        uploadFile: builder.mutation<ApiResponse<ListFilesResponse>, FormData>({
            query: (formData) => ({
                url: '/files/user/',
                method: 'POST',
                body: formData,
                formData: true  
            }),
        }),
        deleteFile: builder.mutation<ApiResponse<void>, string>({
            query: (externalId) => ({
                url: `/files/user/${externalId}/`,
                method: 'DELETE',
            }),
        }),
        createShareLink: builder.mutation<ApiResponse<ShareLinkResponse>, ShareLinkCreateBody>({
            query: (data) => ({
                url: '/files/user/share/',
                method: 'POST',
                body: { ...data },
            }),
        }),
        userAutocomplete: builder.query<ApiResponse<UserAutocompleteResponse[]>, string>({
            query: (email) => `/user/autocomplete/?email=${email}`,
        }),
        fileUserPermissionList: builder.query<ApiResponse<FileUserPermissionListResponse[]>, string>({
            query: (fileId) => `/files/permissions/${fileId}`,
        }),
        // The following mutation creates (in case already not created) or update's a user's permission for a file
        fileUserPermissionCreateUpdate: builder.mutation<ApiResponse<void>, FileUserPermissionCreateUpdateBody[]>({
            query: (data) => ({
                url: '/files/permissions/',
                method: 'PUT',
                body: data,
            }),
        }),
        fileUserPermissionDelete: builder.mutation<ApiResponse<void>, FileUserPermissionDeleteBody>({
            query: (data) => ({
                url: '/files/permissions/',
                method: 'DELETE',
                body: data,
            }),
        }),
        updateGlobalPermission: builder.mutation<ApiResponse<GlobalPermissionUpdateBody>, GlobalPermissionUpdateBody>({
            query: (data) => ({
                url: `/files/user/global/${data.external_id}/`,
                method: 'PATCH',
                body: { global_permission_type: data.global_permission_type },
            }),
        }),
    }),
});

export const { useListFilesQuery, useUploadFileMutation, useCreateShareLinkMutation, useUserAutocompleteQuery, 
    useFileUserPermissionListQuery, useFileUserPermissionCreateUpdateMutation, useFileUserPermissionDeleteMutation, useUpdateGlobalPermissionMutation, useDeleteFileMutation } = filesApi;