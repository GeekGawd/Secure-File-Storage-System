from django.contrib import admin
from .models import FileStorage, FilePermission, ShareableLink

# Register your models here.

admin.site.register(FileStorage)
admin.site.register(FilePermission)
admin.site.register(ShareableLink)
