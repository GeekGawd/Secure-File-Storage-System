from rest_framework.permissions import IsAuthenticated
from django_otp import devices_for_user
from django_otp.plugins.otp_totp.models import TOTPDevice

class IsVerified(IsAuthenticated):
    """
    Permission class that checks if a user is authenticated (JWT) and verified (TOTP).
    """
    def has_permission(self, request, view):
        # First, check if the user is authenticated
        is_authenticated = super().has_permission(request, view)

        # Check if the user is also verified
        is_verified = request.user.is_verified() if is_authenticated else False

        return is_verified

class TOTPVerificationUtils:

    @staticmethod
    def create_totp_device(user):
        device = user.totpdevice_set.create(confirmed=False)
        return device
    
    @staticmethod
    def get_user_totp_device(user, confirmed=None):
        """
        confirmed: None, True, False
        None: Return all devices
        True: Return only confirmed devices
        False: Return only unconfirmed devices
        """
        devices = devices_for_user(user, confirmed=confirmed)
        for device in devices:
            if isinstance(device, TOTPDevice):
                return device