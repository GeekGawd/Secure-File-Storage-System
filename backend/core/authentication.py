from django.conf import settings
import jwt
from rest_framework import authentication
from rest_framework_simplejwt.exceptions import InvalidToken
from authentication.models import User
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import BasePermission

class IsVerified(BasePermission):
    """
    Permission class that checks if a user is authenticated (JWT) and verified (TOTP).
    """
    def has_permission(self, request, view):
        auth_data = authentication.get_authorization_header(request)

        if not auth_data:
            return False
        
        _, token = auth_data.decode('utf-8').split(' ')

        try:
            payload = jwt.decode(jwt=token, key=settings.SECRET_KEY, algorithms=['HS256'])
            return payload.get('is_verified', False) == True
        except:
            return False


class CustomJWTAuthentication(JWTAuthentication):

    def authenticate(self, request):
        auth_data = authentication.get_authorization_header(request)

        if not auth_data:
            return None
        
        _, token = auth_data.decode('utf-8').split(' ')

        try:
            payload = jwt.decode(jwt=token, key=settings.SECRET_KEY, algorithms=['HS256'])
            try:
                user = User.objects.get(external_id=payload['user_id'])
            except:
                raise InvalidToken('Invalid Token')
            return (user, token)
            
        except jwt.ExpiredSignatureError as e:
            raise InvalidToken("Token has Expired")

        except jwt.exceptions.DecodeError as e:
            raise InvalidToken('Invalid Token')


