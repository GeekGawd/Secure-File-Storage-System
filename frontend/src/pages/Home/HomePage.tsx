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
import SearchBar from "@/components/SearchBar";
import { useSearchParams, useNavigate } from "react-router";

export default function HomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get('page');
    return page || "";
  })
  const currentSearch = searchParams.get('search') || '';
  const { data, isLoading, isError, refetch } = useListFilesQuery({page: currentPage, search: currentSearch});
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useDispatch();

  const handleUploadSuccess = useCallback(() => {
    toast.success("File uploaded successfully!");
    refetch();
  }, [refetch]);

  // Dispatch the setFiles action
  useEffect(() => {
    dispatch(setFiles({files: data?.data?.results}));
  }, [data]);


  return (
    <div className="container mx-auto py-10 relative">
      <Toaster />

      {/* Implement Another page */}
      <button onClick={() => navigate('/decrypt-file')}>Decrypt File</button>

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
        <SearchBar />
        <UploadFile onUploadSuccess={handleUploadSuccess} />
      </div>

      {/* Content Section */}
      {isLoading && <div>Loading...</div>}
      {isError && <div>Error loading files</div>}
      {data && <DataTable columns={columns} data={data?.data?.results} />}

      {/* Footer Section */}
      {/* Pagination */}
      {data?.data?.count > 0 && (
        <div className="flex justify-center space-x-2 mt-4">
          {/* Define page limit constant */}
          {(() => {
            const PAGE_LIMIT = 10;
            const totalPages = Math.ceil(data.data.count / PAGE_LIMIT);
            
            return (
              <>        
                <div className="flex space-x-2">
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        const newPage = (index + 1).toString();
                        setCurrentPage(newPage);
                        setSearchParams({ page: newPage, search: currentSearch });
                      }}
                      className={`px-4 py-2 rounded ${
                        parseInt(currentPage || "1") === index + 1
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  )
}