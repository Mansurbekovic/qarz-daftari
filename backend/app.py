from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import uuid
from datetime import datetime

from db import (
    get_all_users,
    get_user_by_username,
    upsert_user,
    delete_user as db_delete_user,
    get_user_db_data,
    save_user_db_data,
    save_payment_intent,
    confirm_payment_intent,
    get_all_payments,
    get_settings,
    save_settings,
    get_sms_logs,
    get_db_stats,
    vacuum_database,
    check_database_integrity,
    create_database_backup,
    get_audit_logs,
    log_audit_event
)
from sms_service import sms_service
from telegram_bot import telegram_service

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})


def create_payment_intent_obj(amount, currency='UZS', card_token=None):
    return {
        "id": f"pi_{uuid.uuid4().hex[:12]}",
        "amount": float(amount),
        "currency": currency,
        "status": "requires_confirmation",
        "cardToken": card_token,
        "createdAt": datetime.utcnow().isoformat(),
    }


@app.get('/health')
def health():
    stats = get_db_stats()
    return jsonify({
        "status": "ok",
        "version": "v3.5 Enterprise Pro",
        "storage": "SQLite ACID WAL",
        "time": datetime.utcnow().isoformat(),
        "stats": stats
    })


# ---------------- USER MANAGEMENT ---------------- #

@app.get('/api/users')
def get_users():
    users = get_all_users()
    return jsonify(users)


@app.post('/api/users')
def create_user():
    payload = request.get_json(silent=True) or {}
    username = payload.get("username")
    if not username:
        return jsonify({"error": "username_required"}), 400

    user = upsert_user(
        username=username,
        business_name=payload.get("businessName"),
        pass_hash=payload.get("passHash"),
        role=payload.get("role", "user"),
        status=payload.get("status", "active")
    )
    safe = dict(user)
    safe.pop("passHash", None)
    return jsonify(safe), 201


@app.put('/api/users/<username>')
def update_user_route(username):
    payload = request.get_json(silent=True) or {}
    existing = get_user_by_username(username)
    if not existing:
        return jsonify({"error": "user_not_found"}), 404

    user = upsert_user(
        username=username,
        business_name=payload.get("businessName"),
        pass_hash=payload.get("passHash"),
        role=payload.get("role"),
        status=payload.get("status")
    )
    safe = dict(user)
    safe.pop("passHash", None)
    return jsonify(safe)


@app.delete('/api/users/<username>')
def delete_user_route(username):
    if username == 'admin':
        return jsonify({"error": "cannot_delete_admin"}), 400
    db_delete_user(username)
    return jsonify({"status": "deleted", "username": username})


@app.post('/api/users/sync')
def sync_users_route():
    payload = request.get_json(silent=True) or []
    if not isinstance(payload, list):
        return jsonify({"error": "invalid_payload"}), 400

    count = 0
    for u in payload:
        uname = u.get("username")
        if not uname:
            continue
        upsert_user(
            username=uname,
            business_name=u.get("businessName"),
            pass_hash=u.get("passHash"),
            role=u.get("role", "user"),
            status=u.get("status", "active")
        )
        count += 1

    return jsonify({"status": "synced", "count": count})


@app.get('/api/users/<username>/db')
def get_user_db_route(username):
    data = get_user_db_data(username)
    return jsonify(data)


@app.post('/api/users/<username>/db')
def save_user_db_route(username):
    payload = request.get_json(silent=True) or {}
    save_user_db_data(username, payload)
    return jsonify({"status": "saved", "username": username})


@app.get('/api/users/<username>/details')
def get_user_details(username):
    user = get_user_by_username(username)
    if not user:
        return jsonify({
            "username": username,
            "businessName": "Mening biznesim",
            "role": "user",
            "status": "active"
        })
    safe = dict(user)
    safe.pop("passHash", None)
    return jsonify(safe)


# ---------------- PAYMENTS & MERCHANT GATEWAYS ---------------- #

@app.post('/api/payments/intent')
def create_payment_intent_endpoint():
    payload = request.get_json(silent=True) or {}
    amount = payload.get('amount', 0)
    card_token = payload.get('cardToken')
    provider = payload.get('provider', 'card')
    intent = create_payment_intent_obj(amount, payload.get('currency', 'UZS'), card_token)
    intent['provider'] = provider
    intent['merchant'] = payload.get('merchant', 'Qarz Daftari Services')
    save_payment_intent(intent)
    return jsonify(intent), 201


@app.post('/api/payments/confirm')
def confirm_payment():
    payload = request.get_json(silent=True) or {}
    intent_id = payload.get('intentId')
    if not intent_id:
        return jsonify({"error": "intent_id_required"}), 400

    updated = confirm_payment_intent(intent_id)
    if not updated:
        return jsonify({"error": "payment_not_found"}), 404
    return jsonify(updated)


@app.get('/api/payments')
def list_payments():
    return jsonify(get_all_payments())


@app.post('/api/payments/payme')
def payme_callback():
    payload = request.get_json(silent=True) or {}
    amount = payload.get('amount', 0)
    account = payload.get('account', {})
    tx_id = f"payme_{uuid.uuid4().hex[:10]}"
    return jsonify({
        "result": {
            "transaction": tx_id,
            "state": 2,
            "create_time": int(datetime.utcnow().timestamp() * 1000),
            "perform_time": int(datetime.utcnow().timestamp() * 1000),
            "amount": amount,
            "account": account
        }
    })


@app.post('/api/payments/click')
def click_callback():
    payload = request.get_json(silent=True) or {}
    click_trans_id = payload.get('click_trans_id') or uuid.uuid4().hex[:8]
    amount = payload.get('amount', 0)
    return jsonify({
        "click_trans_id": click_trans_id,
        "merchant_trans_id": f"click_{uuid.uuid4().hex[:10]}",
        "error": 0,
        "error_note": "Success",
        "amount": amount
    })


@app.post('/api/payments/paynet')
def paynet_callback():
    payload = request.get_json(silent=True) or {}
    amount = payload.get('amount', 0)
    return jsonify({
        "status": "OK",
        "code": 0,
        "message": "Transaction successful",
        "providerTrxnId": f"paynet_{uuid.uuid4().hex[:10]}",
        "amount": amount
    })


# ---------------- SYSTEM SETTINGS & CREDENTIALS ---------------- #

@app.get('/api/settings')
def get_system_settings():
    s = get_settings()
    # Mask secret keys for safe frontend viewing
    safe_settings = dict(s)
    if safe_settings.get("eskiz_password"):
        safe_settings["eskiz_password_masked"] = "••••••••"
    if safe_settings.get("telegram_bot_token"):
        tok = safe_settings["telegram_bot_token"]
        safe_settings["telegram_bot_token_masked"] = tok[:6] + "••••••••" if len(tok) > 10 else "••••••••"
    if safe_settings.get("click_secret"):
        safe_settings["click_secret_masked"] = "••••••••"
    if safe_settings.get("payme_key"):
        safe_settings["payme_key_masked"] = "••••••••"
    return jsonify(safe_settings)


@app.post('/api/settings')
def save_system_settings():
    payload = request.get_json(silent=True) or {}
    save_settings(payload)
    return jsonify({"status": "saved", "settings": payload})


# ---------------- SMS GATEWAY (ESKIZ / PLAYMOBILE) ---------------- #

@app.post('/api/sms/send')
def send_sms_endpoint():
    payload = request.get_json(silent=True) or {}
    phone = payload.get("phone")
    message = payload.get("message")
    if not phone or not message:
        return jsonify({"error": "phone_and_message_required"}), 400

    res = sms_service.send_sms(phone, message)
    return jsonify(res), (200 if res.get("success") else 400)


@app.get('/api/sms/balance')
def get_sms_balance_endpoint():
    res = sms_service.get_balance()
    return jsonify(res)


@app.get('/api/sms/logs')
def get_sms_logs_endpoint():
    limit = int(request.args.get("limit", 50))
    logs = get_sms_logs(limit)
    return jsonify(logs)


# ---------------- TELEGRAM BOT & REMINDERS ---------------- #

@app.post('/api/telegram/test')
def test_telegram_endpoint():
    payload = request.get_json(silent=True) or {}
    token = payload.get("token")
    res = telegram_service.test_bot(token)
    return jsonify(res)


@app.post('/api/telegram/send')
def send_telegram_endpoint():
    payload = request.get_json(silent=True) or {}
    chat_id = payload.get("chatId")
    text = payload.get("text")
    if not chat_id or not text:
        return jsonify({"error": "chatId_and_text_required"}), 400
    res = telegram_service.send_message(chat_id, text)
    return jsonify(res)


@app.post('/api/telegram/reminder')
def send_telegram_reminder_endpoint():
    payload = request.get_json(silent=True) or {}
    chat_id = payload.get("chatId")
    client_name = payload.get("clientName", "Hurmatli Mijoz")
    amount = float(payload.get("amount", 0))
    currency = payload.get("currency", "so'm")
    due_date = payload.get("dueDate")
    business_name = payload.get("businessName", "Qarz Daftari")

    if not chat_id:
        return jsonify({"error": "chatId_required"}), 400

    res = telegram_service.send_debt_reminder(
        chat_id=chat_id,
        client_name=client_name,
        amount=amount,
        currency=currency,
        due_date=due_date,
        business_name=business_name
    )
    return jsonify(res)


# ---------------- SYSTEM STATS & ADMIN OPS ---------------- #

@app.get('/api/system/stats')
def system_stats():
    stats = get_db_stats()
    return jsonify(stats)


@app.post('/api/admin/db/vacuum')
def admin_db_vacuum():
    res = vacuum_database()
    log_audit_event("admin", "DATABASE_VACUUM", "SQLite database defragmented and compacted")
    return jsonify(res)


@app.get('/api/admin/db/integrity')
def admin_db_integrity():
    res = check_database_integrity()
    return jsonify(res)


@app.post('/api/admin/db/backup')
def admin_db_backup():
    res = create_database_backup()
    if res.get("success"):
        log_audit_event("admin", "DATABASE_BACKUP", f"Created backup: {res.get('backupFilename')}")
    return jsonify(res)


@app.get('/api/admin/audit-logs')
def admin_audit_logs():
    limit = int(request.args.get("limit", 100))
    logs = get_audit_logs(limit)
    return jsonify(logs)


@app.post('/api/admin/audit-logs')
def admin_create_audit_log():
    payload = request.get_json(silent=True) or {}
    username = payload.get("username", "admin")
    action = payload.get("action", "CUSTOM_EVENT")
    details = payload.get("details", "")
    ip = request.remote_addr or "127.0.0.1"
    log_id = log_audit_event(username, action, details, ip)
    return jsonify({"success": True, "logId": log_id}), 201


@app.get('/api/admin/broadcast')
def admin_get_broadcast():
    settings = get_settings()
    return jsonify({
        "message": settings.get("system_broadcast_message", ""),
        "enabled": settings.get("system_broadcast_enabled", False),
        "type": settings.get("system_broadcast_type", "info"),
        "updatedAt": settings.get("system_broadcast_updated_at", "")
    })


@app.post('/api/admin/broadcast')
def admin_set_broadcast():
    payload = request.get_json(silent=True) or {}
    save_settings({
        "system_broadcast_message": payload.get("message", ""),
        "system_broadcast_enabled": payload.get("enabled", False),
        "system_broadcast_type": payload.get("type", "info"),
        "system_broadcast_updated_at": datetime.utcnow().isoformat()
    })
    log_audit_event("admin", "UPDATE_BROADCAST", f"Broadcast banner updated: {payload.get('message', '')[:40]}")
    return jsonify({"success": True, "saved": payload})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() in ('1', 'true', 'yes')
    telegram_service.start_scheduler()
    print(f"[*] Qarz Daftari Backend v3.5 Enterprise Pro running on http://0.0.0.0:{port} with SQLite ACID WAL")
    app.run(host='0.0.0.0', port=port, debug=debug)
