from django.contrib import admin
from .models import FileStorage, FilePermission

# Register your models here.

admin.site.register(FileStorage)
admin.site.register(FilePermission)
