import sqlite3
import os
import json
import uuid
import threading
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'qarz_daftari.db')
_db_lock = threading.Lock()


def get_connection():
    """Returns a SQLite connection configured with WAL mode and row factory."""
    conn = sqlite3.connect(DB_PATH, check_same_thread=False, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_db():
    """Initialize database tables with optimal indexes."""
    with _db_lock:
        conn = get_connection()
        cursor = conn.cursor()

        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                business_name TEXT DEFAULT 'Mening biznesim',
                pass_hash TEXT,
                role TEXT DEFAULT 'user',
                status TEXT DEFAULT 'active',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)

        # User DB state (complete JSON synchronization per user)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_dbs (
                username TEXT PRIMARY KEY,
                db_json TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)

        # Standalone Clients table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS clients (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                name TEXT NOT NULL,
                phone TEXT,
                relation TEXT DEFAULT 'owed_to_me',
                balance REAL DEFAULT 0,
                credit_score INTEGER DEFAULT 80,
                is_blacklisted INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone)")

        # Standalone Transactions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                client_id TEXT,
                user_id TEXT,
                type TEXT NOT NULL,
                amount REAL NOT NULL,
                date TEXT NOT NULL,
                note TEXT,
                card_id TEXT,
                created_at TEXT NOT NULL
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tx_client ON transactions(client_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_tx_date ON transactions(date)")

        # Standalone Cards table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cards (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                bank TEXT DEFAULT 'Boshqa',
                type TEXT DEFAULT 'virtual',
                holder TEXT DEFAULT 'Mening kartam',
                balance REAL DEFAULT 0,
                frozen INTEGER DEFAULT 0,
                token TEXT,
                created_at TEXT NOT NULL
            )
        """)

        # Payments table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS payments (
                id TEXT PRIMARY KEY,
                amount REAL NOT NULL,
                currency TEXT DEFAULT 'UZS',
                status TEXT NOT NULL,
                provider TEXT DEFAULT 'card',
                card_token TEXT,
                merchant TEXT,
                created_at TEXT NOT NULL,
                confirmed_at TEXT
            )
        """)

        # Settings table (key-value store for API keys, bot tokens, merchant info)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)

        # SMS Logs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sms_logs (
                id TEXT PRIMARY KEY,
                phone TEXT NOT NULL,
                message TEXT NOT NULL,
                status TEXT NOT NULL,
                provider TEXT DEFAULT 'eskiz',
                response_data TEXT,
                created_at TEXT NOT NULL
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_sms_phone ON sms_logs(phone)")

        # Telegram Subscribers table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS telegram_subscribers (
                chat_id INTEGER PRIMARY KEY,
                username TEXT,
                phone TEXT,
                client_id TEXT,
                subscribed_at TEXT NOT NULL
            )
        """)

        # Audit Logs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                username TEXT,
                action TEXT NOT NULL,
                details TEXT,
                ip_address TEXT,
                created_at TEXT NOT NULL
            )
        """)

        # Insert default admin user if not exists
        cursor.execute("SELECT id FROM users WHERE username = 'admin'")
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO users (id, username, business_name, pass_hash, role, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "1",
                "admin",
                "Tizim Administratori",
                "c7ad44cbad762a5da0a452f9e854fdc1e0e7a52a38015f23f3eab1d80b931dd472634dfac71cd34ebc35d16ab7fb8a90c81f975113d6c7538dc69dd8de9077ec",
                "admin",
                "active",
                datetime.utcnow().isoformat(),
                datetime.utcnow().isoformat()
            ))

        conn.commit()
        conn.close()

    # Migrate from legacy data.json if it exists
    migrate_from_json_if_needed()


def migrate_from_json_if_needed():
    """Migrates existing legacy data.json data safely into SQLite without data loss."""
    json_path = os.path.join(os.path.dirname(__file__), 'data.json')
    if not os.path.exists(json_path):
        return

    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            content = f.read().strip()
            if not content:
                return
            data = json.loads(content)
            if not isinstance(data, dict):
                return
    except Exception as e:
        print(f"[Migration] Could not parse data.json: {e}")
        return

    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Migrate users
        for u in data.get('users', []):
            uname = u.get('username')
            if not uname:
                continue
            cursor.execute("SELECT id FROM users WHERE username = ?", (uname,))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO users (id, username, business_name, pass_hash, role, status, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    str(u.get('id', uuid.uuid4().hex[:8])),
                    uname,
                    u.get('businessName', 'Mening biznesim'),
                    u.get('passHash', ''),
                    u.get('role', 'user'),
                    u.get('status', 'active'),
                    u.get('createdAt', datetime.utcnow().isoformat()),
                    datetime.utcnow().isoformat()
                ))

        # Migrate user_dbs
        for uname, db_val in data.get('user_dbs', {}).items():
            cursor.execute("""
                INSERT OR REPLACE INTO user_dbs (username, db_json, updated_at)
                VALUES (?, ?, ?)
            """, (uname, json.dumps(db_val, ensure_ascii=False), datetime.utcnow().isoformat()))

        # Migrate payments
        for p in data.get('payments', []):
            pid = p.get('id')
            if not pid:
                continue
            cursor.execute("SELECT id FROM payments WHERE id = ?", (pid,))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO payments (id, amount, currency, status, provider, card_token, merchant, created_at, confirmed_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    pid,
                    float(p.get('amount', 0)),
                    p.get('currency', 'UZS'),
                    p.get('status', 'requires_confirmation'),
                    p.get('provider', 'card'),
                    p.get('cardToken'),
                    p.get('merchant', 'Qarz Daftari Services'),
                    p.get('createdAt', datetime.utcnow().isoformat()),
                    p.get('confirmedAt')
                ))

        conn.commit()
        print("[Migration] Successfully migrated data.json into SQLite!")
        # Rename legacy json file to prevent repeated processing
        backup_path = json_path + '.migrated.bak'
        if not os.path.exists(backup_path):
            os.rename(json_path, backup_path)
    except Exception as e:
        print(f"[Migration] Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()


# Database Helpers

def get_all_users():
    conn = get_connection()
    rows = conn.execute("SELECT id, username, business_name, role, status, created_at FROM users ORDER BY created_at ASC").fetchall()
    conn.close()
    return [
        {
            "id": r["id"],
            "username": r["username"],
            "businessName": r["business_name"],
            "role": r["role"],
            "status": r["status"],
            "createdAt": r["created_at"]
        }
        for r in rows
    ]


def get_user_by_username(username):
    conn = get_connection()
    row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    conn.close()
    if not row:
        return None
    return {
        "id": row["id"],
        "username": row["username"],
        "businessName": row["business_name"],
        "passHash": row["pass_hash"],
        "role": row["role"],
        "status": row["status"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"]
    }


def upsert_user(username, business_name=None, pass_hash=None, role=None, status=None):
    conn = get_connection()
    now = datetime.utcnow().isoformat()
    existing = get_user_by_username(username)
    if existing:
        updates = []
        params = []
        if business_name is not None:
            updates.append("business_name = ?")
            params.append(business_name)
        if pass_hash is not None:
            updates.append("pass_hash = ?")
            params.append(pass_hash)
        if role is not None:
            updates.append("role = ?")
            params.append(role)
        if status is not None:
            updates.append("status = ?")
            params.append(status)
        updates.append("updated_at = ?")
        params.append(now)
        params.append(username)

        conn.execute(f"UPDATE users SET {', '.join(updates)} WHERE username = ?", params)
    else:
        new_id = uuid.uuid4().hex[:8]
        conn.execute("""
            INSERT INTO users (id, username, business_name, pass_hash, role, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            new_id,
            username,
            business_name or "Mening biznesim",
            pass_hash or "",
            role or "user",
            status or "active",
            now,
            now
        ))
    conn.commit()
    conn.close()
    return get_user_by_username(username)


def delete_user(username):
    conn = get_connection()
    conn.execute("DELETE FROM users WHERE username = ?", (username,))
    conn.execute("DELETE FROM user_dbs WHERE username = ?", (username,))
    conn.commit()
    conn.close()


def get_user_db_data(username):
    conn = get_connection()
    row = conn.execute("SELECT db_json FROM user_dbs WHERE username = ?", (username,)).fetchone()
    conn.close()
    if not row or not row["db_json"]:
        return {}
    try:
        return json.loads(row["db_json"])
    except Exception:
        return {}


def save_user_db_data(username, data_obj):
    conn = get_connection()
    now = datetime.utcnow().isoformat()
    json_str = json.dumps(data_obj, ensure_ascii=False)
    conn.execute("""
        INSERT OR REPLACE INTO user_dbs (username, db_json, updated_at)
        VALUES (?, ?, ?)
    """, (username, json_str, now))
    conn.commit()
    conn.close()


def save_payment_intent(intent):
    conn = get_connection()
    conn.execute("""
        INSERT OR REPLACE INTO payments (id, amount, currency, status, provider, card_token, merchant, created_at, confirmed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        intent.get("id"),
        float(intent.get("amount", 0)),
        intent.get("currency", "UZS"),
        intent.get("status", "requires_confirmation"),
        intent.get("provider", "card"),
        intent.get("cardToken"),
        intent.get("merchant", "Qarz Daftari Services"),
        intent.get("createdAt", datetime.utcnow().isoformat()),
        intent.get("confirmedAt")
    ))
    conn.commit()
    conn.close()


def confirm_payment_intent(intent_id):
    conn = get_connection()
    now = datetime.utcnow().isoformat()
    conn.execute("""
        UPDATE payments SET status = 'succeeded', confirmed_at = ? WHERE id = ?
    """, (now, intent_id))
    row = conn.execute("SELECT * FROM payments WHERE id = ?", (intent_id,)).fetchone()
    conn.commit()
    conn.close()
    if not row:
        return None
    return dict(row)


def get_all_payments():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM payments ORDER BY created_at DESC LIMIT 100").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_settings():
    conn = get_connection()
    rows = conn.execute("SELECT key, value FROM settings").fetchall()
    conn.close()
    res = {}
    for r in rows:
        try:
            res[r["key"]] = json.loads(r["value"])
        except Exception:
            res[r["key"]] = r["value"]
    return res


def save_settings(settings_dict):
    conn = get_connection()
    now = datetime.utcnow().isoformat()
    for k, v in settings_dict.items():
        val_str = json.dumps(v, ensure_ascii=False) if not isinstance(v, str) else v
        conn.execute("""
            INSERT OR REPLACE INTO settings (key, value, updated_at)
            VALUES (?, ?, ?)
        """, (k, val_str, now))
    conn.commit()
    conn.close()


def log_sms(phone, message, status, provider="eskiz", response_data=None):
    conn = get_connection()
    log_id = f"sms_{uuid.uuid4().hex[:10]}"
    now = datetime.utcnow().isoformat()
    conn.execute("""
        INSERT INTO sms_logs (id, phone, message, status, provider, response_data, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (log_id, phone, message, status, provider, json.dumps(response_data) if response_data else None, now))
    conn.commit()
    conn.close()
    return log_id


def get_sms_logs(limit=50):
    conn = get_connection()
    rows = conn.execute("SELECT * FROM sms_logs ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_db_stats():
    conn = get_connection()
    users_count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    payments_count = conn.execute("SELECT COUNT(*) FROM payments").fetchone()[0]
    sms_count = conn.execute("SELECT COUNT(*) FROM sms_logs").fetchone()[0]
    audit_count = conn.execute("SELECT COUNT(*) FROM audit_logs").fetchone()[0]
    db_size_bytes = os.path.getsize(DB_PATH) if os.path.exists(DB_PATH) else 0
    conn.close()
    return {
        "totalUsers": users_count,
        "totalPayments": payments_count,
        "totalSms": sms_count,
        "totalAuditLogs": audit_count,
        "dbSizeBytes": db_size_bytes,
        "dbSizeFormatted": f"{db_size_bytes / 1024:.2f} KB" if db_size_bytes < 1048576 else f"{db_size_bytes / 1048576:.2f} MB",
        "databaseType": "SQLite (ACID WAL)",
        "serverTime": datetime.utcnow().isoformat(),
        "status": "operational"
    }


def vacuum_database():
    """Runs VACUUM to defragment SQLite database file."""
    conn = get_connection()
    conn.execute("VACUUM")
    conn.close()
    return {"success": True, "message": "Baza muvaffaqiyatli ixchamlashtirildi (VACUUM)"}


def check_database_integrity():
    """Runs PRAGMA integrity_check."""
    conn = get_connection()
    result = conn.execute("PRAGMA integrity_check").fetchall()
    conn.close()
    messages = [r[0] for r in result]
    is_ok = messages == ['ok']
    return {"success": is_ok, "details": messages}


def create_database_backup():
    """Creates a timestamped snapshot backup of the SQLite database."""
    import shutil
    if not os.path.exists(DB_PATH):
        return {"success": False, "error": "Baza fayli topilmadi"}

    backup_filename = f"qarz_daftari_backup_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.db"
    backup_path = os.path.join(os.path.dirname(DB_PATH), backup_filename)
    shutil.copy2(DB_PATH, backup_path)
    return {
        "success": True,
        "backupFilename": backup_filename,
        "backupPath": backup_path,
        "size": os.path.getsize(backup_path),
        "createdAt": datetime.utcnow().isoformat()
    }


def log_audit_event(username, action, details="", ip_address="127.0.0.1"):
    conn = get_connection()
    log_id = f"aud_{uuid.uuid4().hex[:10]}"
    now = datetime.utcnow().isoformat()
    conn.execute("""
        INSERT INTO audit_logs (id, username, action, details, ip_address, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (log_id, username, action, details, ip_address, now))
    conn.commit()
    conn.close()
    return log_id


def get_audit_logs(limit=100):
    conn = get_connection()
    rows = conn.execute("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# Auto-initialize on import
init_db()
