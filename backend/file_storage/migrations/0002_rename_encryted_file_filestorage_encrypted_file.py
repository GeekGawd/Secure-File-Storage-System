# Generated by Django 5.1.4 on 2024-12-29 02:18

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('file_storage', '0001_initial'),
    ]

    operations = [
        migrations.RenameField(
            model_name='filestorage',
            old_name='encryted_file',
            new_name='encrypted_file',
        ),
    ]