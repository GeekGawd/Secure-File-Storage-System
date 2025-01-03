# Generated by Django 5.1.4 on 2024-12-29 09:17

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('file_storage', '0003_filepermission_filestorage_shared_with_shareablelink'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='filepermission',
            options={'verbose_name': 'File Permission', 'verbose_name_plural': 'File Permissions'},
        ),
        migrations.AddConstraint(
            model_name='filepermission',
            constraint=models.UniqueConstraint(fields=('file', 'user'), name='unique_file_user_permission'),
        ),
        migrations.AlterModelTable(
            name='filepermission',
            table='file_permissions',
        ),
    ]
