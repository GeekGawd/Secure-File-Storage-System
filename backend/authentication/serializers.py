from rest_framework.exceptions import ValidationError
import re
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from authentication.models import User
from django.contrib.auth import authenticate

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("email", "password", "name")
        extra_kwargs = {
            "password": {
                "write_only": True,
                "min_length": 5,
                "required": True,
                "error_messages": {"required": "Password needed"},
            },
            "email": {
                "required": True,
                "error_messages": {"required": "Email field may not be blank."},
            },
            "name": {
                "required": True,
                "error_messages": {"required": "Name field may not be blank."},
            },
        }

    def validate_password(self, password):
        if not re.findall("\d", password):
            raise ValidationError(
                _("The password must contain at least 1 digit, 0-9."),
                code="password_no_number",
            )
        if not re.findall("[A-Z]", password):
            raise ValidationError(
                _("The password must contain at least 1 uppercase letter, A-Z."),
                code="password_no_upper",
            )
        if not re.findall("[a-z]", password):
            raise ValidationError(
                _("The password must contain at least 1 lowercase letter, a-z."),
                code="password_no_lower",
            )

        return password

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

    def to_representation(self, instance):
        data = super(UserSerializer, self).to_representation(instance)
        user = instance
        data["access"] = str(user.access())

        return data

class AuthTokenSerializer(serializers.ModelSerializer):
    email = serializers.CharField(required=True, error_messages={
                                  "required": "Email field may not be blank."})
    password = serializers.CharField(write_only=True, min_length=5)

    class Meta:
        model = User
        fields = ['email', 'access', 'refresh', 'password']

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        user = authenticate(
            request=self.context.get('request'),
            username=email,
            password=password
        )

        if not user:
            pass

        return {
            'email': user.email,
            'refresh': user.refresh,
            'access': user.access,
        }