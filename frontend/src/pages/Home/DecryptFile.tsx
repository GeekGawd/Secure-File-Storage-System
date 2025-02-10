import { useState } from 'react';
import { Button } from "@/components/ui/button";

export default function DecryptFile() {
  const [secretKey, setSecretKey] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleDecrypt = async () => {
    if (!file || !secretKey) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('secret_key', secretKey);

      // TODO: Add API call to decrypt file
      
    } catch (error) {
      console.error('Error decrypting file:', error);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-6">Decrypt File</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secret Key
            </label>
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter secret key"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Encrypted File
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <Button
            onClick={handleDecrypt}
            disabled={!file || !secretKey}
            className="w-full"
          >
            Decrypt File
          </Button>
        </div>
      </div>
    </div>
  );
}
