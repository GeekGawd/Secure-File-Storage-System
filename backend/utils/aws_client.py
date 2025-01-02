# Make a singleton class for the AWS client
import localstack_client.session as boto3

class AWSClient:
    _instance = None
    _client = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            # Initialize the KMS client only once
            cls._client = boto3.client('kms')
        return cls._instance

    def get_client(self):
        return self._client