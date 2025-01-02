from rest_framework.serializers import ModelSerializer
from file_storage.models import FileStorage, ShareableLink, FilePermission, PERMISSION_CHOICES
from rest_framework import serializers
from authentication.models import User

class ListFileStorageSerializer(ModelSerializer):
    class Meta:
        model = FileStorage
        fields = ['external_id', 'file_name', "created_at", "updated_at", "global_permission_type"]
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        return data

class FileStorageSerializer(ModelSerializer):
    class Meta:
        model = FileStorage
        fields = ['external_id', 'file_name', 'encrypted_file', 'encrypted_key', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class ShareableLinkSerializer(ModelSerializer):
    file = serializers.SlugRelatedField(
        queryset=FileStorage.objects.all(),
        slug_field='external_id'
    )
    
    class Meta:
        model = ShareableLink
        fields = ['external_id', 'file', 'expires_at', 'view_count_limit', 'view_count', 'created_at', 'updated_at']
        extra_kwargs = {
            'created_by': {'required': False},
            'view_count': {'required': False},
            'expires_at': {'required': False},
            'view_count_limit': {'required': False},
        }
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)

class ListFilePermissionSerializer(ModelSerializer):
    file = serializers.SlugRelatedField(
        slug_field='external_id',
        read_only=True
    )
    user = serializers.SlugRelatedField(
        slug_field='external_id',
        read_only=True
    )
    class Meta:
        model = FilePermission
        fields = ['file', 'user', 'permission_type']
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['email'] = instance.user.email
        return data

class FilePermissionSerializer(ModelSerializer):
    file = serializers.SlugRelatedField(
        queryset=FileStorage.objects.all(),
        slug_field='external_id'
    )
    user = serializers.SlugRelatedField(
        queryset=User.objects.all(),
        slug_field='email'
    )
    class Meta:
        model = FilePermission
        fields = ['file', 'user', 'permission_type']
    
    def create(self, validated_data):
        return super().create(validated_data)

class AutoCompleteUserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ['email', "external_id"]

class GlobalPermissionSerializer(ModelSerializer):
    global_permission_type = serializers.ChoiceField(choices=PERMISSION_CHOICES)
    class Meta:
        model = FileStorage
        fields = ['global_permission_type']
    
    def update(self, instance, validated_data):
        instance.global_permission_type = validated_data['global_permission_type']
        instance.save(update_fields=['global_permission_type'])
        return instance
