from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework import generics, status, mixins
from authentication.models import User
from authentication.serializers import UserSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from core.authentication import IsVerified
from rest_framework.views import APIView
from utils.response import success_response, error_response
from utils.totp_verification import TOTPVerificationUtils
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenRefreshSerializer, TokenObtainPairSerializer
from rest_framework_simplejwt.exceptions import InvalidToken
import jwt
from django.conf import settings
from core.constants import COOKIE_REFRESH_TOKEN_MAX_AGE
from rest_framework_simplejwt.tokens import RefreshToken


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
        verified_device = TOTPVerificationUtils.get_user_totp_device(user, confirmed=True)
        
        if verified_device:
            return success_response(data={"url": None}, message="TOTP already verified", status_code=status.HTTP_200_OK)

        if device is None:
            device = TOTPVerificationUtils.create_totp_device(user)

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
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        email = request.data.get("email", None)

        if User.objects.filter(email__iexact=email).exists():
            return error_response(data={}, message="User already exists", status_code=status.HTTP_400_BAD_REQUEST)

        return super().create(request, *args, **kwargs)

class CookieTokenRefreshSerializer(TokenRefreshSerializer):
    refresh = None
    def validate(self, attrs):
        attrs['refresh'] = self.context['request'].COOKIES.get('refresh_token')
        # Check if the token is blacklisted
        if attrs['refresh']:
            blacklisted = RefreshToken(attrs['refresh']).check_blacklist()
            if blacklisted:
                raise InvalidToken('Token is')
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
            response.set_cookie('refresh_token', response.data['refresh'], max_age=COOKIE_REFRESH_TOKEN_MAX_AGE, httponly=True, secure=True)
            del response.data['refresh']

        return super().finalize_response(request, response, *args, **kwargs)

class CookieTokenRefreshView(TokenRefreshView):
    serializer_class = CookieTokenRefreshSerializer
    
    def get(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        # Add email to response data from the access token payload
        access_token = response.data.get('access', None)
        if access_token:
            payload = jwt.decode(access_token, settings.SECRET_KEY, algorithms=['HS256'])
            response.data['email'] = payload['email']

        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            refresh_token = request.COOKIES.get('refresh_token', None)
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
                response = success_response(data={}, message="Logout successful", status_code=status.HTTP_200_OK)
                response.delete_cookie('refresh_token')
                return response
            else:
                return error_response(data={}, message="No refresh token found", status_code=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return error_response(data={}, message=f"{e}", status_code=status.HTTP_400_BAD_REQUEST)