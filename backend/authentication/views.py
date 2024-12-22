from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework import generics, status, mixins
from authentication.models import User
from authentication.serializers import UserSerializer, AuthTokenSerializer
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView


class HelloWorld(APIView):
    def get(self, request, *args, **kwargs):
        # Prepare your response data
        data = {"message": "Hello, World!"}
        return Response(data, content_type='application/json')


class CreateUserView(generics.GenericAPIView, mixins.CreateModelMixin):
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get("email", None)

        if User.objects.filter(email__iexact=email).exists():
            return Response(
                {"message": "User already exists"}, status=status.HTTP_400_BAD_REQUEST
            )

        return super().create(request, *args, **kwargs)


class LoginAPIView(GenericAPIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        request_email = request.data.get('email',)
        try:
            User.objects.get(email__iexact = request_email)
        except User.DoesNotExist:
            return Response({'status':'User not registered'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = AuthTokenSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data, status=status.HTTP_200_OK)