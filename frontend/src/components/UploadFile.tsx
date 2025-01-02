import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { useUploadFileMutation, UploadFileFormData } from "@/api/routes/files"
import EnvelopeEncryptionService from "@/utils/encrypt_file";
import { toast } from "react-hot-toast";
import { Spinner } from "@/components/ui/spinner";
import { selectCurrentAccessToken } from "@/store/auth/authSlice"
import { useSelector } from "react-redux"

export function UploadFile({ onUploadSuccess }: { onUploadSuccess: () => void }) {
    const [fileName, setFileName] = useState("")
    const [isDragging, setIsDragging] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const dropZoneRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploadFileMutation, { isLoading, isError }] = useUploadFileMutation();
    const encryptionService = new EnvelopeEncryptionService();

    const handleUploadFile = async () => {
        if (!fileInputRef.current?.files?.[0]) {
            console.error("No file selected");
            return;
        }
        const file = fileInputRef.current.files[0];

        const { encryptedBlob, dek } = await encryptionService.encrypt(file);

        // Convert Blob to base64
        const formData = new FormData();

        formData.append('file', encryptedBlob);
        formData.append('file_name', fileName);
        formData.append('encrypted_key', dek);

        try {
            const response = await uploadFileMutation(formData).unwrap();
            setIsOpen(false);
            onUploadSuccess?.();
        } catch (error) {
            console.error("Error uploading file:", error);
        }
    }

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)

        const file = e.dataTransfer.files?.[0]
        if (file) {
            setFileName(file.name)
        }
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            setFileName(file.name)
        }
    }

    const handleSelectAreaClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <>
            <Button onClick={() => setIsOpen(true)} className="bg-black hover:bg-gray-800 text-white">
                Upload File
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 transition-opacity">
                    <div
                        ref={dropZoneRef}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className={`relative w-full max-w-md p-6 bg-white rounded-lg shadow-lg transition-transform transform ${
                            isDragging ? "scale-105 border-2 border-black" : "border border-gray-400"
                        } `}
                    >
                        {/* Close Button */}
                        <button
                            type="button"
                            className="absolute top-1 right-1 text-black hover:text-gray-800"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Selectable Area with Dotted Border */}
                        <div
                            onClick={handleSelectAreaClick}
                            className={`flex flex-col items-center justify-center py-4 border-2 border-dashed border-gray-600 rounded-md cursor-pointer`}
                        >
                            <svg
                                className={`w-12 h-12 mb-4 transition-transform ${
                                    isDragging ? "transform rotate-45" : ""
                                }`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 16V4m0 0L3 8m4-4l4 4m5 12H5a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2v10a2 2 0 01-2 2z"
                                />
                            </svg>
                            <p className="text-lg font-semibold text-black">Drag and drop your file here</p>
                            <p className="mt-2 text-sm text-gray-600">or click to select a file</p>
                        </div>

                        {/* File Name Input */}
                        <div className="mt-4">
                            <Label htmlFor="fileName" className="block text-sm font-medium text-black">
                                File Name
                            </Label>
                            <Input
                                type="text"
                                id="fileName"
                                value={fileName}
                                onChange={(e) => setFileName(e.target.value)}
                                placeholder="Enter file name"
                                className="mt-1 block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-gray-800 focus:border-gray-800"
                                ref={inputRef}
                            />
                        </div>

                        {/* Hidden File Input */}
                        <input
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                            id="fileInput"
                            ref={fileInputRef}
                        />

                        {/* Action Buttons */}
                        <div className="mt-6 flex justify-end space-x-3">
                            <Button
                                variant="secondary"
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-black"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUploadFile}
                                disabled={!fileName || isLoading}
                                className={`px-4 py-2 ${
                                    isLoading
                                        ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                                        : fileName
                                        ? "bg-black hover:bg-gray-800 text-white"
                                        : "bg-gray-500 text-gray-300 cursor-not-allowed"
                                }`}
                            >
                                {isLoading ? <Spinner /> : "Upload"}
                            </Button>
                        </div>

                        {/* Error Message Display */}
                        {isError && (
                            <div className="mt-2 text-red-600">Error uploading file</div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}