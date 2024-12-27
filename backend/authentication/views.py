from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework import generics, status, mixins
from authentication.models import User
from authentication.serializers import UserSerializer, AuthTokenSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from core.authentication import IsVerified
from rest_framework.views import APIView
from utils.response import success_response, error_response, redirect_response
from utils.totp_verification import TOTPVerificationUtils
from time import sleep
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer, TokenObtainPairSerializer
from rest_framework_simplejwt.exceptions import InvalidToken
import jwt
from django.conf import settings
from core.constants import COOKIE_REFRESH_TOKEN_MAX_AGE, TOTP_REDIRECT_CLIENT_URL
from django_otp import devices_for_user
from django_otp.plugins.otp_totp.models import TOTPDevice

class HelloWorld(APIView):
    def get(self, request, *args, **kwargs):
        # Prepare your response data
        data = {"message": "Hello, World!"}
        return Response(data, content_type='application/json')

class HelloWorldVerified(APIView):
    permission_classes = [IsVerified]
    def get(self, request, *args, **kwargs):
        # Prepare your response data
        data = {"message": "Hello, World Verified!"}
        return Response(data, content_type='application/json')


class TOTPCreateView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        device = TOTPVerificationUtils.get_user_totp_device(user)
        url = None
        if not device:
            device = user.totpdevice_set.create(confirmed=False)
            url = device.config_url
        return success_response(data={"url": url}, message="TOTP created", status_code=status.HTTP_200_OK)

class TOTPVerifyView(GenericAPIView):
    """
    Use this endpoint to verify/enable a TOTP device
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        token = request.data.get("token", None)
        device = TOTPVerificationUtils.get_user_totp_device(user)
        if not device == None and device.verify_token(token):
            if not device.confirmed:
                device.confirmed = True
                device.save(update_fields=["confirmed"])
            
            access_token = str(request.user.access(is_verified=True))
            refresh_token = str(request.user.refresh(is_verified=True)) 
            data = {
                "access": access_token,
            }

            response = success_response(data=data, message="TOTP verified", status_code=status.HTTP_200_OK)
            response.set_cookie('refresh_token', refresh_token, max_age=COOKIE_REFRESH_TOKEN_MAX_AGE, httponly=True)
            return response
        
        return error_response(data={}, message="TOTP verification failed", status_code=status.HTTP_400_BAD_REQUEST)

class CreateUserView(generics.GenericAPIView, mixins.CreateModelMixin):
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get("email", None)

        if User.objects.filter(email__iexact=email).exists():
            return error_response(data={}, message="User already exists", status_code=status.HTTP_400_BAD_REQUEST)

        return super().create(request, *args, **kwargs)

class CookieTokenRefreshSerializer(TokenRefreshSerializer):
    refresh = None
    def validate(self, attrs):
        attrs['refresh'] = self.context['request'].COOKIES.get('refresh_token')
        if attrs['refresh']:
            return super().validate(attrs)
        else:
            raise InvalidToken('No valid token found in cookie \'refresh_token\'')

class CookieTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user, is_verified=False):
        return user.generate_token(is_verified)

class CookieTokenObtainPairView(TokenObtainPairView):
    serializer_class = CookieTokenObtainPairSerializer  

    def finalize_response(self, request, response, *args, **kwargs):
        email = request.data.get('email', None)

        if email:
            # Add email to response data
            response.data['user'] = email
        
        # Check if user has a verified TOTP device
        device = TOTPVerificationUtils.get_user_totp_device(request.user, confirmed=True)

        if response.data.get('refresh'):    
            response.set_cookie('refresh_token', response.data['refresh'], max_age=COOKIE_REFRESH_TOKEN_MAX_AGE, httponly=True)
            del response.data['refresh']

        return super().finalize_response(request, response, *args, **kwargs)

class CookieTokenRefreshView(TokenRefreshView):
    serializer_class = CookieTokenRefreshSerializer
    
    def get(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.data.get('refresh'):
            response.set_cookie('refresh_token', response.data['refresh'], max_age=COOKIE_REFRESH_TOKEN_MAX_AGE, httponly=True )
            del response.data['refresh']
        
        # Add email to response data from the access token payload
        access_token = response.data.get('access', None)
        if access_token:
            payload = jwt.decode(access_token, settings.SECRET_KEY, algorithms=['HS256'])
            response.data['email'] = payload['email']

        return response