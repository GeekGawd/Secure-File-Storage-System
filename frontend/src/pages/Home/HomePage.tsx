import { useListFilesQuery } from "@/api/routes/files"
import { DataTable } from "@/components/data-table"
import { columns } from "@/components/columns"
import { UploadFile } from "@/components/UploadFile"
import { useCallback, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { setFiles } from "@/store/files/fileSlice";
import { useDispatch } from "react-redux";
import { UserProfile } from "@/components/UserProfile";
import { UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { data, isLoading, isError, refetch } = useListFilesQuery();
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();

  const handleUploadSuccess = useCallback(() => {
    toast.success("File uploaded successfully!");
    refetch();
  }, [refetch]);

  // Dispatch the setFiles action
  useEffect(() => {
    dispatch(setFiles(data?.data || []));
  }, [data]);

  return (
    <div className="container mx-auto py-10 relative">
      <Toaster />

      {/* User Profile Button */}
      <div className="absolute top-4 right-4 z-50">
        <Button
          variant="ghost" 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full"
        >
          <span className="sr-only">Open user menu</span>
          <UserIcon className="h-6 w-6" />
        </Button>
        {isOpen && (
          <div className="absolute right-0 mt-2">
            <UserProfile />
          </div>
        )}
      </div>
      
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4 mt-16">
        <h1 className="text-2xl font-bold">Files</h1>
        <UploadFile onUploadSuccess={handleUploadSuccess} />
      </div>

      {/* Content Section */}
      {isLoading && <div>Loading...</div>}
      {isError && <div>Error loading files</div>}
      {data && <DataTable columns={columns} data={data.data} />}
    </div>
  )
}