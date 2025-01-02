"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Users, Share2, Download, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ListFilesResponse, useListFilesQuery } from "@/api/routes/files"
import { useState } from "react"
import { ManageAccess } from "@/components/ManageAccess"
import { BASE_URL } from "@/api";
import { useDeleteFileMutation } from "@/api/routes/files";
import toast from "react-hot-toast"

export const columns: ColumnDef<ListFilesResponse>[] = [
  {
    accessorKey: "file_name",
    header: "File Name",
    cell: ({ row }) => {
      const fileName = row.getValue("file_name") as string;
      const encryptedFileUrl = BASE_URL + "/files/user/" + row.original.external_id;

      return (
        <a href={encryptedFileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
          {fileName}
        </a>
      );
    },
  },
  {
    accessorKey: "updated_at",
    header: "Last Modified",
    cell: ({ row }) => {
      const dateString = row.getValue("updated_at") as string
      const date = new Date(dateString)
      return date.toLocaleDateString()
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const file = row.original
      const encryptedFileUrl = BASE_URL + "/files/user/" + file.external_id;
      const [showManageAccessDialog, setShowManageAccessDialog] = useState(false)
      const [deleteFile] = useDeleteFileMutation();
      const { refetch } = useListFilesQuery();
      const handleDeleteFile = async (externalId: string) => {
        await deleteFile(externalId).unwrap();
        toast.success("File deleted successfully");
        // refetch the files
        refetch();
      };
      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setShowManageAccessDialog(true)}>
                <Users className="mr-2 h-4 w-4" />
                Manage Access
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href={encryptedFileUrl} target="_blank" rel="noopener noreferrer" download>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-500" onClick={() => handleDeleteFile(file.external_id)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {showManageAccessDialog && (
            <ManageAccess 
              onClose={() => setShowManageAccessDialog(false)} 
              fileId={file.external_id} 
            />
          )}
        </>
      )
    },
  },
]

