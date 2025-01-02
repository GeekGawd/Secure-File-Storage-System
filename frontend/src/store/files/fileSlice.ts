import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store";
import { ListFilesResponse, PermissionType } from "@/api/routes/files";

interface FileState {
    files: ListFilesResponse[];
}

const fileSlice = createSlice({
    name: "files",
    initialState: {} as FileState,
    reducers: {
        setFiles: (state, action: PayloadAction<ListFilesResponse[]>) => {
            state.files = action.payload;
        },
        setGlobalPermissionType: (state, action: PayloadAction<{ fileId: string, globalPermissionType: PermissionType }>) => {
            const { fileId, globalPermissionType } = action.payload;
            const file = state.files.find(file => file.external_id === fileId);
            if (file) {
                file.global_permission_type = globalPermissionType;
            }
        }
    }
});

export const { setFiles, setGlobalPermissionType } = fileSlice.actions;
export default fileSlice.reducer;


export const getFileGlobalPermissionType = (state: RootState, externalId: string) => {
    const file = state.files.files.find(file => file.external_id === externalId);
    return file?.global_permission_type as PermissionType;
};