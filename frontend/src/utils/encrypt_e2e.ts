export interface EncryptE2EServiceInterface {
  encrypt(file: File, seedPhrase: string): Promise<Blob>;
  decrypt(encryptedFile: File, seedPhrase: string): Promise<Uint8Array>;
}

class EncryptE2EService implements EncryptE2EServiceInterface {
  private webCrypto = window.crypto;

  private async generateKeyPair(): Promise<CryptoKeyPair> {
    return await this.webCrypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"]
    );
  }

  private async encryptPrivateKey(privateKey: CryptoKey, seedPhrase: string): Promise<ArrayBuffer> {
    // Derive encryption key from seed phrase
    const encoder = new TextEncoder();
    const seedData = encoder.encode(seedPhrase);
    const keyMaterial = await this.webCrypto.subtle.importKey(
      "raw",
      seedData,
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    const salt = this.webCrypto.getRandomValues(new Uint8Array(16));
    const derivedKey = await this.webCrypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );

    // Export private key to raw format
    const exportedPrivateKey = await this.webCrypto.subtle.exportKey(
      "pkcs8",
      privateKey
    );

    // Encrypt the private key
    const iv = this.webCrypto.getRandomValues(new Uint8Array(12));
    const encryptedPrivateKey = await this.webCrypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      derivedKey,
      exportedPrivateKey
    );

    // Combine salt + iv + encrypted key
    const combined = new Uint8Array(
      salt.byteLength + iv.byteLength + encryptedPrivateKey.byteLength
    );
    combined.set(salt, 0);
    combined.set(iv, salt.byteLength);
    combined.set(new Uint8Array(encryptedPrivateKey), salt.byteLength + iv.byteLength);

    return combined.buffer;
  }

  private async decryptPrivateKey(encryptedData: ArrayBuffer, seedPhrase: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const seedData = encoder.encode(seedPhrase);
    const keyMaterial = await this.webCrypto.subtle.importKey(
      "raw",
      seedData,
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    const encryptedContent = new Uint8Array(encryptedData);
    const salt = encryptedContent.slice(0, 16);
    const iv = encryptedContent.slice(16, 28);
    const encryptedKey = encryptedContent.slice(28);

    const derivedKey = await this.webCrypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );

    const decryptedKeyData = await this.webCrypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      derivedKey,
      encryptedKey
    );

    return await this.webCrypto.subtle.importKey(
      "pkcs8",
      decryptedKeyData,
      {
        name: "RSA-OAEP",
        hash: "SHA-256"
      },
      true,
      ["decrypt"]
    );
  }

  public async encrypt(file: File, seedPhrase: string): Promise<Blob> {
    // Generate key pair
    const keyPair = await this.generateKeyPair();

    // Encrypt private key with seed phrase
    const encryptedPrivateKey = await this.encryptPrivateKey(keyPair.privateKey, seedPhrase);

    // Read and encrypt file content
    const fileContent = await file.arrayBuffer();
    const encryptedContent = await this.webCrypto.subtle.encrypt(
      {
        name: "RSA-OAEP"
      },
      keyPair.publicKey,
      fileContent
    );

    // Combine encrypted private key length + encrypted private key + encrypted content
    const privateKeyLengthBytes = new Uint8Array(4);
    new DataView(privateKeyLengthBytes.buffer).setUint32(0, encryptedPrivateKey.byteLength, true);

    const combined = new Uint8Array(
      privateKeyLengthBytes.byteLength + encryptedPrivateKey.byteLength + encryptedContent.byteLength
    );
    combined.set(privateKeyLengthBytes, 0);
    combined.set(new Uint8Array(encryptedPrivateKey), 4);
    combined.set(new Uint8Array(encryptedContent), 4 + encryptedPrivateKey.byteLength);

    return new Blob([combined], { type: 'application/octet-stream' });
  }

  public async decrypt(encryptedFile: File, seedPhrase: string): Promise<Uint8Array> {
    const fileData = await encryptedFile.arrayBuffer();
    const fileContent = new Uint8Array(fileData);

    // Extract encrypted private key length and data
    const privateKeyLength = new DataView(fileContent.buffer).getUint32(0, true);
    const encryptedPrivateKey = fileContent.slice(4, 4 + privateKeyLength);
    const encryptedContent = fileContent.slice(4 + privateKeyLength);

    // Decrypt private key using seed phrase
    const privateKey = await this.decryptPrivateKey(encryptedPrivateKey, seedPhrase);

    // Decrypt file content using private key
    const decryptedContent = await this.webCrypto.subtle.decrypt(
      {
        name: "RSA-OAEP"
      },
      privateKey,
      encryptedContent
    );

    return new Uint8Array(decryptedContent);
  }
}

export default EncryptE2EService;
