from django.shortcuts import render
from rest_framework.generics import GenericAPIView
from rest_framework.mixins import ListModelMixin, CreateModelMixin, UpdateModelMixin, DestroyModelMixin
from core.authentication import IsVerified
from file_storage.serializers import FileStorageSerializer
from file_storage.models import FileStorage, ShareableLink, FilePermission
from rest_framework.parsers import MultiPartParser, FormParser
from utils.response import success_response, error_response
from file_storage.serializers import ListFileStorageSerializer, ShareableLinkSerializer,\
      AutoCompleteUserSerializer, ListFilePermissionSerializer, FilePermissionSerializer, GlobalPermissionSerializer
from utils.encrypt import EncryptService
from django.http import FileResponse
from authentication.models import User
from core.authentication import CustomJWTAuthenticationForShareableLink, IsVerifiedForShareableLink
from core.constants import PERMISSION_CHOICES
import base64
import os
from rest_framework.pagination import PageNumberPagination

class ListViewPagination(PageNumberPagination):
    page_size = 10
    ordering = "id"

class ListUserFilesView(GenericAPIView, ListModelMixin):
    permission_classes = [IsVerified]   
    serializer_class = ListFileStorageSerializer
    pagination_class = ListViewPagination

    def get_queryset(self):
        search = self.request.query_params.get('search', None)
        files = FileStorage.objects.filter(user=self.request.user)
        if search: 
            files = files.filter(file_name__icontains=search)
        # Order by id for cursor pagination
        return files
    
    def get(self, request, *args, **kwargs):
        
        # Get the queryset
        queryset = self.get_queryset()
        
        # Get paginated results
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        # If pagination is disabled, return all results
        serializer = self.get_serializer(queryset, many=True)
        return success_response(serializer.data)

class UploadUserFileView(GenericAPIView, CreateModelMixin):
    serializer_class = FileStorageSerializer
    permission_classes = [IsVerified]
    parser_classes = (MultiPartParser, FormParser)
    
    def post(self, request, *args, **kwargs):
        file = request.FILES.get('file')
        encrypted_key = request.data.get('encrypted_key')
        file_name = request.data.get('file_name')

        if not file:
            return error_response({'error': 'No file provided'}, message="Please provide a file", status_code=400)
        
        if not encrypted_key:
            return error_response({'error': 'No encrypted key provided'}, message="Please provide an encrypted key", status_code=400)
        
        if not file_name:
            return error_response({'error': 'No file name provided'}, message="Please provide a file name", status_code=400)
        

        # Encrypt the dek received from the client
        try:
            encrypted_key = EncryptService.encrypt_data_cmk(encrypted_key)
        except Exception as e:
            return error_response({'error': 'Failed to encrypt the key ' + str(e)}, message=f"Failed to encrypt the key {str(e)}", status_code=400)
        
        if encrypted_key == None:
            return error_response({'error': 'Failed to encrypt the key'}, message="Failed to encrypt the key", status_code=400)
        
        data = {
            'file_name': file_name,
            'encrypted_file': file,
            'encrypted_key': encrypted_key
        }
        
        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return success_response(serializer.data, message="File uploaded successfully", status_code=201)
        return error_response(serializer.errors, message="Invalid data provided", status_code=400)


class BulkUploadUserFileView(GenericAPIView, CreateModelMixin):
    serializer_class = FileStorageSerializer
    permission_classes = [IsVerified]
    parser_classes = (MultiPartParser, FormParser)
    
    def post(self, request, *args, **kwargs):
        files = request.FILES.getlist('file')
        
        encrypted_keys_data = request.data.get("encrypted_key").strip("[]").split(",")
        encrypted_keys = [key.replace('"', '') for key in encrypted_keys_data]

        file_names_data = request.data.get("file_name").strip("[]").split(",")
        file_names = [name.replace('"', '') for name in file_names_data]


        if not files:
            return error_response({'error': 'No file provided'}, message="Please provide a file", status_code=400)
        
        if not encrypted_keys:
            return error_response({'error': 'No encrypted key provided'}, message="Please provide an encrypted key", status_code=400)
        
        if not file_names:
            return error_response({'error': 'No file name provided'}, message="Please provide a file name", status_code=400)
        
       
        if len(files) != len(encrypted_keys) or len(files) != len(file_names):
            return error_response({'error': 'Number of files, encrypted keys and file names must be equal'}, message="Number of files, encrypted keys and file names must be equal", status_code=400)

        payload = []

        for i in range(len(files)):
            file = files[i]
            encrypted_key = encrypted_keys[i]
            file_name = file_names[i]

            # Encrypt the dek received from the client
            try:
                encrypted_key = EncryptService.encrypt_data_cmk(encrypted_key)
            except Exception as e:
                return error_response({'error': 'Failed to encrypt the key ' + str(e)}, message=f"Failed to encrypt the key {str(e)}", status_code=400)
            
            if encrypted_key == None:
                return error_response({'error': 'Failed to encrypt the key'}, message="Failed to encrypt the key", status_code=400)
            
            data = {
                'file_name': file_name,
                'encrypted_file': file,
                'encrypted_key': encrypted_key
            }

            payload.append(data)
            
        serializer = self.get_serializer(data=payload, many=True)

        if serializer.is_valid():
            serializer.save()
            return success_response(serializer.data, message="Files uploaded successfully", status_code=201)
        return error_response(serializer.errors, message="Invalid data provided", status_code=400)
    

class UserFileView(GenericAPIView, DestroyModelMixin):
    permission_classes = [IsVerifiedForShareableLink]
    authentication_classes = [CustomJWTAuthenticationForShareableLink]
    lookup_field = 'external_id'
    lookup_url_kwarg = 'file_id'

    def get_queryset(self):
        return FileStorage.objects.filter(external_id=self.kwargs.get('file_id'), user=self.request.user)

    def delete(self, request, *args, **kwargs):
        try:
            file = FileStorage.objects.get(external_id=kwargs.get('file_id'))
            file_path = file.encrypted_file.path
            if os.path.exists(file_path):
                os.remove(file_path)
            return self.destroy(request, *args, **kwargs)
        except FileStorage.DoesNotExist:
            return error_response({'error': 'File does not exist'}, message="File does not exist", status_code=404)

    def get(self, request, *args, **kwargs):
        # User file view render
        file_external_id = self.kwargs.get('file_id')
        file = FileStorage.objects.get(external_id=file_external_id)
        decrypted_file = EncryptService.decrypt_file(file)
        if file.file_name.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp')):
            image_data = decrypted_file.read()
            base64_image = base64.b64encode(image_data).decode('utf-8')
            return render(request, 'view_download_image.html', {'base64_image': base64_image, 'file_name': file.file_name})
        
        # if the user has download/all permission, set attachment
        response = FileResponse(decrypted_file, content_type='application/octet-stream', as_attachment=True, filename=file.file_name)
        return response
    
class ShareableLinkCreateView(GenericAPIView, CreateModelMixin):
    serializer_class = ShareableLinkSerializer
    permission_classes = [IsVerified]

    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)

class ShareableLinkView(GenericAPIView, CreateModelMixin):
    permission_classes = [IsVerifiedForShareableLink]
    authentication_classes = [CustomJWTAuthenticationForShareableLink]

    def get(self, request, *args, **kwargs):

        external_id = kwargs.get('external_id')

        if not external_id:
            return error_response({'error': 'No external id provided'}, message="Please provide an external id", status_code=400)
        
        # Check if the link is valid
        try:
            shareable_link = ShareableLink.objects.get(external_id=external_id)
        except ShareableLink.DoesNotExist:
            return error_response({'error': 'Broken Link to the file'}, message="Broken Link to the file", status_code=400)
        
        # Check if the link is valid 
        if not shareable_link.can_be_viewed:
            return error_response({'error': 'Link expired or view count limit reached'}, message="Link expired or view count limit reached", status_code=400)
    
        # Check if the user has read/download permission
        file = shareable_link.file
        file_permissions = file.file_permissions.filter(user=request.user).first()

        if not shareable_link.all_user_permission and not file_permissions:
            return error_response({'error': 'You do not have permission to view this file'}, message="You do not have permission to view this file", status_code=400)

        # Decrypt the file
        decrypted_file = EncryptService.decrypt_file(file)

        # Update the view count
        shareable_link.view_count += 1
        shareable_link.save(update_fields=['view_count'])

        # Get the permission type
        permission_type = file_permissions.permission_type if file_permissions else file.global_permission_type
        
        # if the user has read permission only, set inline
        if file.file_name.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp')):
            image_data = decrypted_file.read()
            base64_image = base64.b64encode(image_data).decode('utf-8')

            if permission_type == PERMISSION_CHOICES[0][0]:
                return render(request, 'view_image.html', {'base64_image': base64_image}) 
                     
            if permission_type == PERMISSION_CHOICES[1][0]:
                response = FileResponse(decrypted_file, content_type='application/octet-stream')
                response['Content-Disposition'] = f'inline; filename="{file.file_name}"'
                return response
            
            if permission_type == PERMISSION_CHOICES[2][0]:
                return render(request, 'view_download_image.html', {'base64_image': base64_image, 'file_name': file.file_name})
        
        # if the user has download/all permission, set attachment
        response = FileResponse(decrypted_file, content_type='application/octet-stream', as_attachment=True, filename=file.file_name)
        return response
        

class ListFilePermissionsView(GenericAPIView, ListModelMixin):
    serializer_class = ListFilePermissionSerializer
    permission_classes = [IsVerified]

    def get_queryset(self):
        file_id = self.kwargs.get('file_id')
        if not file_id:
            return error_response({'error': 'No file id provided'}, message="Please provide a file id", status_code=400)
        return FilePermission.objects.filter(file__external_id=file_id).exclude(user=self.request.user).exclude(user__is_superuser=True)
    
    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)

class FilePermissionView(GenericAPIView, CreateModelMixin):
    serializer_class = FilePermissionSerializer
    permission_classes = [IsVerified]

    def put(self, request, *args, **kwargs):
        
        permission_data = request.data

        file_permissions = []

        # Validate the request data
        for permission in permission_data:
            file = permission.get('file')
            user_external_id = permission.get('user')
            permission_type = permission.get('permission_type', 'view')

            if file is None or user_external_id is None:
                return error_response({'error': 'Invalid request data'}, message="Invalid request data", status_code=400)
            
            # Check if the file exists
            try:
                file = FileStorage.objects.get(external_id=file)
            except FileStorage.DoesNotExist:
                return error_response({'error': 'File does not exist'}, message="File does not exist", status_code=400)
            
            # Check if the user exists
            try:
                user = User.objects.get(external_id=user_external_id)
            except User.DoesNotExist:
                return error_response({'error': 'User does not exist'}, message="User does not exist", status_code=400)
            
            # Check if the user is the owner of the file
            if file.user != request.user and not request.user.is_superuser:
                return error_response({'error': 'You do not have permission to modify permissions of one of the files'}, message="You do not have permission to modify permissions of one of the files", status_code=403)
        
            file_permissions.append(FilePermission(file=file, user=user, permission_type=permission_type))

        FilePermission.objects.bulk_create(file_permissions, update_conflicts=True, update_fields=['permission_type'], unique_fields=['file', 'user'])


        return success_response({}, message="Permissions processed successfully")
    
    def delete(self, request, *args, **kwargs):
        file_id = request.data.get('file')
        user_external_id = request.data.get('user')

        if not file_id or not user_external_id:
            return error_response({'error': 'Invalid request data'}, message="Invalid request data", status_code=400)
        
        try:
            file = FileStorage.objects.get(external_id=file_id)
        except FileStorage.DoesNotExist:
            return error_response({'error': 'File does not exist'}, message="File does not exist", status_code=400)
        
        try:
            user = User.objects.get(external_id=user_external_id)
        except User.DoesNotExist:
            return error_response({'error': 'User does not exist'}, message="User does not exist", status_code=400)
        
        if file.user != request.user and not request.user.is_superuser:
            return error_response({'error': 'You do not have permission to modify permissions of this file'}, message="You do not have permission to modify permissions of this file", status_code=403)
        
        try:
            permission = FilePermission.objects.get(file=file, user=user)
            permission.delete()
            return success_response({}, message="Permission deleted successfully")
        except FilePermission.DoesNotExist:
            return error_response({'error': 'Permission does not exist'}, message="Permission does not exist", status_code=400)
    

class AutoCompleteUserView(GenericAPIView, ListModelMixin):
    serializer_class = AutoCompleteUserSerializer
    permission_classes = [IsVerified]

    def get_queryset(self):
        query = self.request.query_params.get('email', '')
        # exclude admin and current user and filter by email
        if query:
            return User.objects.exclude(is_superuser=True).exclude(email=self.request.user.email).filter(email__icontains=query)[:5]
        return User.objects.none()
    
    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)

class GlobalPermissionView(GenericAPIView, UpdateModelMixin):
    serializer_class = GlobalPermissionSerializer
    permission_classes = [IsVerified]
    lookup_field = 'external_id'
    lookup_url_kwarg = 'file_id'

    def get_queryset(self):
        file_external_id = self.kwargs.get('file_id')
        if file_external_id:
            return FileStorage.objects.filter(external_id=file_external_id, user=self.request.user)
        return FileStorage.objects.filter(user=self.request.user)
    
    def patch(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

