from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import json
import uuid
from datetime import datetime

app = Flask(__name__)
CORS(app)

DATA_FILE = os.path.join(os.path.dirname(__file__), 'data.json')


def load_data():
    if not os.path.exists(DATA_FILE):
        return {"users": [], "clients": [], "transactions": [], "cards": []}
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def create_payment_intent(amount, currency='UZS', card_token=None):
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
    return jsonify({"status": "ok", "time": datetime.utcnow().isoformat()})


@app.get('/api/users')
def get_users():
    data = load_data()
    return jsonify(data.get("users", []))


@app.post('/api/users')
def create_user():
    payload = request.json or {}
    data = load_data()
    user = {
        "id": str(len(data["users"]) + 1),
        "username": payload.get("username"),
        "businessName": payload.get("businessName", "Mening biznesim"),
        "role": payload.get("role", "user"),
        "status": payload.get("status", "active"),
        "createdAt": datetime.utcnow().isoformat(),
    }
    data["users"].append(user)
    save_data(data)
    return jsonify(user), 201


@app.get('/api/clients')
def get_clients():
    data = load_data()
    return jsonify(data.get("clients", []))


@app.post('/api/clients')
def create_client():
    payload = request.json or {}
    data = load_data()
    client = {
        "id": str(len(data["clients"]) + 1),
        "name": payload.get("name"),
        "relation": payload.get("relation", "owed_to_me"),
        "createdAt": datetime.utcnow().isoformat(),
    }
    data["clients"].append(client)
    save_data(data)
    return jsonify(client), 201


@app.get('/api/transactions')
def get_transactions():
    data = load_data()
    return jsonify(data.get("transactions", []))


@app.post('/api/transactions')
def create_transaction():
    payload = request.json or {}
    data = load_data()
    tx = {
        "id": str(len(data["transactions"]) + 1),
        "clientId": payload.get("clientId"),
        "type": payload.get("type", "debt"),
        "amount": payload.get("amount", 0),
        "date": payload.get("date", datetime.utcnow().date().isoformat()),
        "note": payload.get("note", ""),
        "cardId": payload.get("cardId"),
    }
    data["transactions"].append(tx)
    save_data(data)
    return jsonify(tx), 201


@app.get('/api/cards')
def get_cards():
    data = load_data()
    return jsonify(data.get("cards", []))


@app.post('/api/cards')
def create_card():
    payload = request.json or {}
    data = load_data()
    card = {
        "id": str(len(data["cards"]) + 1),
        "bank": payload.get("bank", "Boshqa"),
        "type": payload.get("type", "virtual"),
        "holder": payload.get("holder", "Mening kartam"),
        "balance": payload.get("balance", 0),
        "frozen": payload.get("frozen", False),
        "token": payload.get("token") or f"tok_{uuid.uuid4().hex[:10]}",
    }
    data["cards"].append(card)
    save_data(data)
    return jsonify(card), 201


@app.post('/api/payments/intent')
def create_payment_intent_endpoint():
    payload = request.json or {}
    amount = payload.get('amount', 0)
    card_token = payload.get('cardToken')
    intent = create_payment_intent(amount, payload.get('currency', 'UZS'), card_token)
    data = load_data()
    data.setdefault('payments', []).append(intent)
    save_data(data)
    return jsonify(intent), 201


@app.post('/api/payments/confirm')
def confirm_payment():
    payload = request.json or {}
    data = load_data()
    intent_id = payload.get('intentId')
    payment = None
    for item in data.get('payments', []):
        if item.get('id') == intent_id:
            payment = item
            break

    if not payment:
        return jsonify({"error": "payment_not_found"}), 404

    payment['status'] = 'succeeded'
    payment['confirmedAt'] = datetime.utcnow().isoformat()
    save_data(data)
    return jsonify(payment)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
