from django.db import models
from authentication.models import User
from core.behaviours import TimeStampable, UUIDable
from django.utils import timezone
from core.constants import PERMISSION_CHOICES
# Create your models here.


class FileStorage(TimeStampable, UUIDable):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='files')
    file_name = models.CharField(max_length=255)
    encrypted_file = models.FileField(upload_to='encrypted_blobs/')
    shared_with = models.ManyToManyField(User, related_name='shared_files', blank=True, through='FilePermission')
    # The following field contains the encrypted DEK for the file
    encrypted_key = models.CharField(max_length=255)
    global_permission_type = models.CharField(max_length=25, choices=PERMISSION_CHOICES, default='all')

    def __str__(self):
        return self.file_name
    
    class Meta:
        db_table = 'file_storage'
        verbose_name = 'File Storage'
        verbose_name_plural = 'File Storages'
    
    def save(self, *args, **kwargs):
        # First save the object to get an ID
        super().save(*args, **kwargs)
        
        # Share the file with the user and all admins
        admins = User.objects.filter(is_superuser=True)
        self.shared_with.add(self.user, *admins)

class FilePermission(TimeStampable, UUIDable):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='file_permissions')
    file = models.ForeignKey(FileStorage, on_delete=models.CASCADE, related_name='file_permissions')
    permission_type = models.CharField(max_length=25, choices=PERMISSION_CHOICES, default='all')
    
    def __str__(self):
        return f"FilePermission({self.user.email}, {self.file.file_name}, {self.permission_type})"
    
    class Meta:
        db_table = 'file_permissions'
        verbose_name = 'File Permission'
        verbose_name_plural = 'File Permissions'
        constraints = [
            models.UniqueConstraint(fields=['file', 'user'], name='unique_file_user_permission')
        ]

class ShareableLink(TimeStampable, UUIDable):
    """
    Model to store shareable link details for a FileStorage instance
    """

    file = models.ForeignKey(
        FileStorage,
        on_delete=models.CASCADE,
        related_name='shareable_links'
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_links'
    )

    # Time-based expiry
    expires_at = models.DateTimeField(null=True, blank=True)

    #  view count limit
    view_count_limit = models.IntegerField(default=0)
    
    view_count = models.IntegerField(default=0)

    def __str__(self):
        return f"ShareableLink({self.file.file_name}, token={self.external_id})"

    @property
    def all_user_permission(self):
        """
        This function will return:
        True: If there is no fine grain permission for the file
        False: If there is a fine grain permission for the file, meaning only some users have access to the file
        """
        file_permission_to_be_viewed_by_all_user = self.file.file_permissions.exclude(user=self.created_by).exclude(user__is_superuser=True).first()
        if file_permission_to_be_viewed_by_all_user:
            return False
        return True
    
    @property
    def is_expired(self) -> bool:
        """
        Checks if the share link is expired based on the expiry time
        """
        if self.expires_at and timezone.now() > self.expires_at:
            return True
        return False

    @property
    def can_be_viewed(self) -> bool:
        """
        Checks if the link can be viewed based on expiry and one-time usage
        """
        if self.is_expired:
            return False
        if self.view_count_limit != 0 and self.view_count >= self.view_count_limit:
            return False
        return True

    class Meta:
        db_table = 'shareable_links'
        verbose_name = 'Shareable Link'
        verbose_name_plural = 'Shareable Links'