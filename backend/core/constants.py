BACKUP_CODE_LENGTH = 12
BACKUP_CODE_COUNT = 10
COOKIE_REFRESH_TOKEN_MAX_AGE = 3600 * 24 * 14 # 14 days

# Redirect URLS
TOTP_REDIRECT_CLIENT_URL = "/totp/create"

PERMISSION_CHOICES = (
    ('read', 'Read-Only'),
    ('download', 'Download'),
    ('all', 'All'),
)