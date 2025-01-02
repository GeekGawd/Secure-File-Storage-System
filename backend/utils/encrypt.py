from decouple import config
from utils.aws_client import AWSClient
import base64
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import io
from file_storage.models import FileStorage
import os

class EncryptService:

    @staticmethod
    def encrypt_data_cmk(data:str) -> str:
        """
        This function takes in the DEK, encrypts it using CMK gets the CiphertextBlob 
        and then encodes it to base64.
        """
        cmk_id = os.environ.get('AWS_CUSTOMER_MASTER_KEY_ID')
        client = AWSClient().get_client()
        response = client.encrypt(KeyId=cmk_id, Plaintext=data)

        if response.get('CiphertextBlob') == None:
            return None
        
        base64_data = base64.b64encode(response['CiphertextBlob']).decode('utf-8')

        return base64_data

    @staticmethod
    def decrypt_data_cmk(data:str) -> str:
        """
        This function takes in the base64encoded CiphertextBlob and decodes the base64 
        string and then decrypts the data using the CMK
        """
        client = AWSClient().get_client()
        
        # Decode the base64 string
        data = base64.b64decode(data)
        response = client.decrypt(CiphertextBlob=data)

        if response.get('Plaintext') == None:
            return None
        
        return response.get('Plaintext').decode('utf-8')

    @staticmethod
    def decrypt_data_dek(dek_base64: str, encrypted_bytes: bytes) -> bytes:
        """
        Decrypts the file bytes using the provided Base64-encoded DEK.
        
        :param dek_base64: The DEK (Data Encryption Key) as a Base64-encoded string.
        :param encrypted_bytes: The raw bytes of the encrypted file.
        This should be the concatenation of:
            [12-byte IV] + [ciphertext + 16-byte authentication tag]
        :return: The decrypted plaintext as bytes.
        """
        # 1. Decode the DEK from Base64
        dek = base64.b64decode(dek_base64)
        
        # 2. Extract the 12-byte IV from the beginning
        iv = encrypted_bytes[:12]
        
        # 3. The rest is ciphertext plus the 16-byte authentication tag
        ciphertext_with_tag = encrypted_bytes[12:]
        
        # 4. Separate out the actual ciphertext from the tag
        #    By default, AES-GCM uses a 16-byte (128-bit) tag
        tag = ciphertext_with_tag[-16:]
        ciphertext = ciphertext_with_tag[:-16]
        
        # 5. Construct a Cipher object using AES-GCM with the given IV and tag
        cipher = Cipher(
            algorithms.AES(dek),
            modes.GCM(iv, tag),
            backend=default_backend()
        )
        
        # 6. Decrypt the ciphertext
        decryptor = cipher.decryptor()
        plaintext = decryptor.update(ciphertext) + decryptor.finalize()
        
        return plaintext

    @staticmethod
    def decrypt_file(file: FileStorage) -> io.BytesIO:
        """
        Decrypts the file bytes using the provided Base64-encoded DEK.
        """
        decrypted_key = EncryptService.decrypt_data_cmk(file.encrypted_key)
        encrypted_content = file.encrypted_file.read()
        decrypted_content = EncryptService.decrypt_data_dek(decrypted_key, encrypted_content)
        decrypted_file = io.BytesIO(decrypted_content)
        return decrypted_file