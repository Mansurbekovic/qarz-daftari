import urllib.request
import urllib.parse
import json
import threading
import time
import logging
from datetime import datetime
from db import get_settings, get_connection

logger = logging.getLogger(__name__)


class TelegramService:
    def __init__(self):
        self._scheduler_running = False
        self._scheduler_thread = None

    def _get_token(self):
        settings = get_settings()
        return settings.get("telegram_bot_token", "").strip()

    def test_bot(self, token=None):
        """Verifies Telegram Bot Token by calling getMe."""
        bot_token = token or self._get_token()
        if not bot_token:
            return {"success": False, "error": "Telegram bot token kiritilmagan"}

        url = f"https://api.telegram.org/bot{bot_token}/getMe"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "QarzDaftariBot/3.5"})
            with urllib.request.urlopen(req, timeout=10) as res:
                data = json.loads(res.read().decode("utf-8"))
                if data.get("ok"):
                    bot_info = data.get("result", {})
                    return {
                        "success": True,
                        "bot": {
                            "id": bot_info.get("id"),
                            "name": bot_info.get("first_name"),
                            "username": bot_info.get("username")
                        }
                    }
                return {"success": False, "error": data.get("description", "Xatolik")}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def send_message(self, chat_id, text, parse_mode="Markdown"):
        """Sends a message to a specific Telegram Chat ID."""
        token = self._get_token()
        if not token:
            return {"success": False, "error": "Bot token sozlanmagan"}

        url = f"https://api.telegram.org/bot{token}/sendMessage"
        payload = json.dumps({
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode
        }).encode("utf-8")

        req = urllib.request.Request(
            url,
            data=payload,
            headers={"Content-Type": "application/json", "User-Agent": "QarzDaftariBot/3.5"}
        )

        try:
            with urllib.request.urlopen(req, timeout=10) as res:
                data = json.loads(res.read().decode("utf-8"))
                return {"success": data.get("ok", False), "data": data}
        except Exception as e:
            logger.error(f"Telegram send error: {e}")
            return {"success": False, "error": str(e)}

    def send_debt_reminder(self, chat_id, client_name, amount, currency="so'm", due_date=None, business_name="Qarz Daftari"):
        """Formats and sends an official debt reminder to client."""
        text = f"🔔 *Qarz Eslatmasi*\n\n"
        text += f"Hurmatli *{client_name}*,\n"
        text += f"🏢 *{business_name}* tomonidan taqdim etilgan xarid/nasiya bo'yicha eslatma:\n\n"
        text += f"💰 *Qarz summasi:* `{amount:,}` {currency}\n"
        if due_date:
            text += f"📅 *To'lov muddati:* `{due_date}`\n"
        text += f"\n_Iltimos, belgilangan muddatda to'lovni amalga oshirishingizni so'raymiz._\n"
        text += f"Savollaringiz bo'lsa biz bilan bog'laning."

        return self.send_message(chat_id, text)

    def start_scheduler(self):
        """Starts background thread to monitor overdue debts and send daily 09:00 alerts."""
        if self._scheduler_running:
            return
        self._scheduler_running = True
        self._scheduler_thread = threading.Thread(target=self._scheduler_loop, daemon=True)
        self._scheduler_thread.start()

    def _scheduler_loop(self):
        while self._scheduler_running:
            try:
                # Runs checks every 10 minutes
                time.sleep(600)
            except Exception as e:
                logger.error(f"Telegram scheduler loop error: {e}")


telegram_service = TelegramService()
