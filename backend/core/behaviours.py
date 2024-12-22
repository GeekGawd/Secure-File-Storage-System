from django.db import models
import uuid

class UUIDable(models.Model):
    """
    Abstract model to add external_id to any model
    """
    external_id = models.UUIDField(unique=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract=True
    

class TimeStampable(models.Model):
    """
    Abstract model to add created_at and updated_at fields to any model
    """
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract=True