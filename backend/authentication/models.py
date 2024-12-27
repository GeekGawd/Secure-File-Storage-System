from django.db import models
from django.utils.crypto import get_random_string
from django.contrib.auth.hashers import make_password, check_password
from core.constants import BACKUP_CODE_LENGTH, BACKUP_CODE_COUNT


from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from rest_framework_simplejwt.tokens import RefreshToken
from core.behaviours import TimeStampable, UUIDable

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        user = self.model(email=self.normalize_email(email), **extra_fields)
        user.set_password(password)
        user.is_active = True
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password):
        user = self.create_user(email, password)
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.save(update_fields=["is_staff", "is_superuser", "is_active"])
        return user

    def generate_backup_codes(self, user, count=BACKUP_CODE_COUNT):
        """
        Generate and hash backup codes for the user.
        """
        codes = []
        for _ in range(count):
            raw_code = get_random_string(length=BACKUP_CODE_LENGTH)  # Generate a random code
            hashed_code = make_password(raw_code)   # Hash the code
            codes.append((BackupCode(user=user, code=hashed_code), raw_code))

        # Save hashed codes to the database
        BackupCode.objects.bulk_create([entry[0] for entry in codes])

        # Return raw codes for the user to store securely
        return [entry[1] for entry in codes]

    def verify_backup_code(self, user, raw_code):
        """
        Verify if a raw backup code is valid for the user.
        Returns True if a valid backup code is found and marked as used.
        """
        # Get all unused backup codes for the user
        unused_codes = BackupCode.objects.filter(user=user, is_used=False)
        
        # Check each unused code
        for backup_code in unused_codes:
            if check_password(raw_code, backup_code.code):
                backup_code.is_used = True
                backup_code.save(update_fields=["is_used"])
                return True
        
        return False

class User(AbstractBaseUser, PermissionsMixin, TimeStampable, UUIDable):
    email = models.EmailField(max_length=255, unique=True)
    name = models.CharField(max_length=255)
    backup_tokens = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"

    def generate_token(self, is_verified=False):
        token = RefreshToken.for_user(self)

        # Add user id to the token payload
        token['user_id'] = self.external_id.hex

        # Add email to the token payload 
        token['email'] = self.email

        # Set is_verified to true if the user has verified the through TOTP login
        token['is_verified'] = is_verified

        return token

    def tokens(self, is_verified=False):
        token = self.generate_token(is_verified)
        return {"refresh": token, "access": token.access_token}

    def refresh(self, is_verified=False):
        token = self.generate_token(is_verified)
        return token

    def access(self, is_verified=False):
        token = self.generate_token(is_verified)
        return token.access_token
    
class BackupCode(TimeStampable):
    # Generated this function from AI
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='backup_codes')
    code = models.CharField(max_length=100)
    is_used = models.BooleanField(default=False)

    @classmethod
    def generate_codes(cls, user, count=10):
        """
        Generate and hash backup codes for the user.
        """
        codes = []
        for _ in range(count):
            raw_code = get_random_string(length=12)  # Generate a random code
            hashed_code = make_password(raw_code)   # Hash the code
            codes.append((cls(user=user, code=hashed_code), raw_code))

        # Save hashed codes to the database
        cls.objects.bulk_create([entry[0] for entry in codes])

        # Return raw codes for the user to store securely
        return [entry[1] for entry in codes]

    def __str__(self):
        return self.code
    