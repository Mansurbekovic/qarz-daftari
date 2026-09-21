import urllib.request
import urllib.parse
import json
import logging
from datetime import datetime
from db import log_sms, get_settings

logger = logging.getLogger(__name__)

ESKIZ_BASE_URL = "https://notify.eskiz.uz/api"


class SMSService:
    def __init__(self):
        self._cached_token = None
        self._token_expires_at = None

    def _get_credentials(self):
        settings = get_settings()
        return {
            "email": settings.get("eskiz_email", "").strip(),
            "password": settings.get("eskiz_password", "").strip(),
            "from_name": settings.get("eskiz_from", "4546").strip() or "4546",
            "is_test_mode": settings.get("eskiz_test_mode", True)
        }

    def login(self, email=None, password=None):
        creds = self._get_credentials()
        email = email or creds["email"]
        password = password or creds["password"]

        if not email or not password:
            return None, "Eskiz email va maxfiy kalit (parol) sozlanmagan"

        data = urllib.parse.urlencode({
            "email": email,
            "password": password
        }).encode("utf-8")

        req = urllib.request.Request(
            f"{ESKIZ_BASE_URL}/auth/login",
            data=data,
            headers={"User-Agent": "QarzDaftari/3.5"}
        )

        try:
            with urllib.request.urlopen(req, timeout=10) as res:
                body = json.loads(res.read().decode("utf-8"))
                token = body.get("data", {}).get("token")
                if token:
                    self._cached_token = token
                    return token, None
                return None, body.get("message", "Eskiz autentifikatsiya xatosi")
        except Exception as e:
            logger.error(f"Eskiz login error: {e}")
            return None, str(e)

    def send_sms(self, phone, message):
        """Sends an SMS via Eskiz or records mock SMS if in test/demo mode."""
        clean_phone = "".join(filter(str.isdigit, str(phone)))
        if clean_phone.startswith("998") and len(clean_phone) == 12:
            pass
        elif len(clean_phone) == 9:
            clean_phone = "998" + clean_phone
        else:
            return {"success": False, "error": "Noto'g'ri telefon raqami formati. Namuna: +998901234567"}

        creds = self._get_credentials()

        # If test mode is enabled or no credentials configured, record as demo/test delivery
        if creds["is_test_mode"] or not creds["email"] or not creds["password"]:
            log_id = log_sms(clean_phone, message, "SENT (TEST/DEMO)", provider="mock", response_data={"note": "Test mode"})
            return {
                "success": True,
                "mode": "test",
                "message": "SMS muvaffaqiyatli jo'natildi (Test rejimi)",
                "logId": log_id,
                "phone": clean_phone
            }

        # Real Eskiz SMS sending
        if not self._cached_token:
            token, err = self.login()
            if not token:
                log_sms(clean_phone, message, "FAILED_AUTH", provider="eskiz", response_data={"error": err})
                return {"success": False, "error": f"Eskiz login xatosi: {err}"}

        payload = urllib.parse.urlencode({
            "mobile_phone": clean_phone,
            "message": message,
            "from": creds["from_name"],
            "callback_url": ""
        }).encode("utf-8")

        req = urllib.request.Request(
            f"{ESKIZ_BASE_URL}/message/sms/send",
            data=payload,
            headers={
                "Authorization": f"Bearer {self._cached_token}",
                "User-Agent": "QarzDaftari/3.5"
            }
        )

        try:
            with urllib.request.urlopen(req, timeout=12) as res:
                body = json.loads(res.read().decode("utf-8"))
                status = "SENT" if body.get("status") == "waiting" or body.get("status") == "success" else "PENDING"
                log_id = log_sms(clean_phone, message, status, provider="eskiz", response_data=body)
                return {
                    "success": True,
                    "mode": "live",
                    "status": status,
                    "eskizId": body.get("id"),
                    "logId": log_id
                }
        except Exception as e:
            logger.error(f"Eskiz send error: {e}")
            log_sms(clean_phone, message, "FAILED", provider="eskiz", response_data={"error": str(e)})
            return {"success": False, "error": str(e)}

    def get_balance(self):
        """Fetches remaining Eskiz SMS balance."""
        creds = self._get_credentials()
        if creds["is_test_mode"] or not creds["email"]:
            return {"success": True, "mode": "test", "balance": 1500, "currency": "SMS (Test)"}

        if not self._cached_token:
            token, err = self.login()
            if not token:
                return {"success": False, "error": err}

        req = urllib.request.Request(
            f"{ESKIZ_BASE_URL}/user/get-user-info",
            headers={"Authorization": f"Bearer {self._cached_token}"}
        )

        try:
            with urllib.request.urlopen(req, timeout=10) as res:
                body = json.loads(res.read().decode("utf-8"))
                balance = body.get("data", {}).get("balance", 0)
                return {"success": True, "balance": balance, "data": body.get("data", {})}
        except Exception as e:
            return {"success": False, "error": str(e)}


sms_service = SMSService()
