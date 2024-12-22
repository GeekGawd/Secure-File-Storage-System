from django.db import models
import uuid
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from rest_framework_simplejwt.tokens import RefreshToken
from core.behaviours import TimeStampable, UUIDable
from django.core.exceptions import ValidationError
from django.core.mail import EmailMessage


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


class User(AbstractBaseUser, PermissionsMixin, TimeStampable, UUIDable):
    email = models.EmailField(max_length=255, unique=True)
    name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = "email"

    def generate_token(self):
        refresh = RefreshToken.for_user(self)
        return str(refresh), str(refresh.access_token)

    def tokens(self):
        refresh, access = self.generate_token()
        return {"refresh": refresh, "access": access}

    def refresh(self):
        refresh, _ = self.generate_token()
        return refresh

    def access(self):
        _, access = self.generate_token()
        return access
