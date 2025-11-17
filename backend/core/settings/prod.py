from .base import *  # noqa

DEBUG = False
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 3600
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# Sentry (enabled only if SENTRY_DSN set)
import os

SENTRY_DSN = os.getenv("SENTRY_DSN")
if SENTRY_DSN:
	import sentry_sdk
	from sentry_sdk.integrations.django import DjangoIntegration

	sentry_sdk.init(
		dsn=SENTRY_DSN,
		integrations=[DjangoIntegration()],
		traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.0")),
		send_default_pii=False,
	)
