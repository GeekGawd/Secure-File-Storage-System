# Generated by Django 5.1.4 on 2024-12-29 02:49

import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('file_storage', '0002_rename_encryted_file_filestorage_encrypted_file'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='FilePermission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('external_id', models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('permission_type', models.CharField(choices=[('read', 'Read-Only'), ('download', 'Download'), ('all', 'All')], default='all', max_length=25)),
                ('file', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='file_permissions', to='file_storage.filestorage')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='file_permissions', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.AddField(
            model_name='filestorage',
            name='shared_with',
            field=models.ManyToManyField(blank=True, related_name='shared_files', through='file_storage.FilePermission', to=settings.AUTH_USER_MODEL),
        ),
        migrations.CreateModel(
            name='ShareableLink',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('external_id', models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('expires_at', models.DateTimeField(blank=True, null=True)),
                ('view_count_limit', models.IntegerField(default=0)),
                ('view_count', models.IntegerField(default=0)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='created_links', to=settings.AUTH_USER_MODEL)),
                ('file', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='shareable_links', to='file_storage.filestorage')),
            ],
            options={
                'verbose_name': 'Shareable Link',
                'verbose_name_plural': 'Shareable Links',
                'db_table': 'shareable_links',
            },
        ),
    ]
