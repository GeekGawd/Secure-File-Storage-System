export interface EncryptFileServiceInterface {
  encrypt(file: File): Promise<{ dek: string; encryptedBlob: Blob }>;
  decrypt(dek: string, encryptedFile: File): Promise<Uint8Array>;
}

class EnvelopeEncryptionService implements EncryptFileServiceInterface {
    private webCrypto = window.crypto;  

    public arrayBufferToBase64(buffer: ArrayBuffer): string {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      bytes.forEach((b) => (binary += String.fromCharCode(b)));
      return window.btoa(binary);
    }

    /**
     * Encrypts a file locally using a generated data encryption key (DEK).
     * Returns a new File object (with ".encrypted" extension) and the DEK as a Base64 string.
     * @param file The File object to encrypt.
     */
    public async encrypt(file: File): Promise<{ dek: string; encryptedBlob: Blob }> {
      // Generate a random 256-bit DEK (Data Encryption Key)
      const dek = crypto.getRandomValues(new Uint8Array(32)); // 32 bytes = 256 bits
    
      // Generate a random 96-bit IV (Initialization Vector)
      const iv = crypto.getRandomValues(new Uint8Array(12)); // 12 bytes = 96 bits
    
      // Read the file as ArrayBuffer
      const plaintext = await file.arrayBuffer();
    
      // Import the DEK as a CryptoKey
      const key = await crypto.subtle.importKey(
        'raw',
        dek,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );
    
      // Encrypt the data using AES-GCM
      const ciphertext = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        plaintext
      );
    
      // The ciphertext includes the auth tag at the end (last 16 bytes)
      // However, Web Crypto API handles the auth tag internally, so we need to append it manually.
      // To ensure compatibility, we can store IV + ciphertext (which includes the auth tag)
      const encryptedArray = new Uint8Array(ciphertext);
      const combined = new Uint8Array(iv.byteLength + encryptedArray.byteLength);
      combined.set(iv, 0);
      combined.set(encryptedArray, iv.byteLength);
    
      // Create a Blob from the combined data
      const encryptedBlob = new Blob([combined]);
    
      // Encode DEK in base64 for safe storage/transmission
      const dekBase64 = this.arrayBufferToBase64(dek.buffer);
    
      return { dek: dekBase64, encryptedBlob };
    }
  
    /**
     * Decrypts an encrypted File using the provided DEK (as a Base64 string).
     * @param dek Base64-encoded DEK (the string returned by `encrypt`).
     * @param encryptedFile The File object previously returned by `encrypt`.
     * @returns A Uint8Array of the decrypted file contents.
     */
    public async decrypt(dek: string, encryptedFile: File): Promise<Uint8Array> {
      // Step 1: Convert Base64 DEK back to a Uint8Array
      const dekBinaryString = atob(dek);
      const dekArray = new Uint8Array(dekBinaryString.length);
      for (let i = 0; i < dekBinaryString.length; i++) {
        dekArray[i] = dekBinaryString.charCodeAt(i);
      }
  
      // Step 2: Read the encrypted File
      const fileData = await encryptedFile.arrayBuffer();
      const encryptedContent = new Uint8Array(fileData);
  
      // Step 3: Extract IV (first 16 bytes) + ciphertext (remaining bytes)
      const iv = encryptedContent.slice(0, 16);
      const ciphertextWithTag = encryptedContent.slice(16);
  
      // Step 4: Import DEK as a CryptoKey for decryption
      const key = await this.webCrypto.subtle.importKey(
        "raw",
        dekArray,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
      );
  
      // Step 5: Decrypt the ciphertext using AES-256-GCM
      let decryptedArrayBuffer: ArrayBuffer;
      try {
        decryptedArrayBuffer = await this.webCrypto.subtle.decrypt(
          {
            name: "AES-GCM",
            iv: iv,
          },
          key,
          ciphertextWithTag
        );
      } catch (error) {
        throw new Error("Decryption failed. Authentication tag mismatch or corrupted data.");
      }
  
      // Return the raw bytes (as Uint8Array)
      return new Uint8Array(decryptedArrayBuffer);
    }
  }
  
  export default EnvelopeEncryptionService;
  