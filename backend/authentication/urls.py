from django.urls import path
from authentication.views import CreateUserView, CookieTokenObtainPairView, CookieTokenRefreshView, TOTPCreateView, TOTPVerifyView, HelloWorld, HelloWorldVerified, LogoutView

urlpatterns = [
    path('register/', CreateUserView.as_view(), name='register'),
    path('login/', CookieTokenObtainPairView.as_view(), name='login'),
    path('refresh/', CookieTokenRefreshView.as_view(), name='refresh'),
    path('totp/create/', TOTPCreateView.as_view(), name='totp-create'),
    path('totp/verify/', TOTPVerifyView.as_view(), name='totp-verify'),
    path('hello/', HelloWorld.as_view(), name='hello'),
    path('hello-verified/', HelloWorldVerified.as_view(), name='hello-verified'),
    path('logout/', LogoutView.as_view(), name='logout'),
]
