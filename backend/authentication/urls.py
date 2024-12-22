from django.urls import path
from authentication.views import CreateUserView, LoginAPIView, HelloWorld

urlpatterns = [
    path('', HelloWorld.as_view(), name='hello'),
    path('register/', CreateUserView.as_view(), name='register'),
    path('login/', LoginAPIView.as_view(), name='login'),
]
