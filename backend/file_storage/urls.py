from django.urls import path
from file_storage.views import UploadUserFileView, ListUserFilesView, ShareableLinkView, ListFilePermissionsView, FilePermissionView, ShareableLinkCreateView, GlobalPermissionView, UserFileView
urlpatterns = [
    path('user/list/', ListUserFilesView.as_view(), name='user_files_list'),
    path('user/', UploadUserFileView.as_view(), name='user_files'),
    path('user/share/', ShareableLinkCreateView.as_view(), name='share_link_create'),
    path('user/global/<str:file_id>/', GlobalPermissionView.as_view(), name='global_permission_file'),
    path('user/<str:file_id>/', UserFileView.as_view(), name='user_file'),
    path('share/', ShareableLinkView.as_view(), name='share_link'),
    path('share/<str:external_id>/', ShareableLinkView.as_view(), name='share_link'),   
    path('permissions/<str:file_id>/', ListFilePermissionsView.as_view(), name='list_file_permissions'),
    path('permissions/', FilePermissionView.as_view(), name='file_permission')
]