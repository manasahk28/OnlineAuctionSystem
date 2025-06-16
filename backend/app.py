from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import datetime
import bcrypt  

app = Flask(__name__)
CORS(app)


from dotenv import load_dotenv
import os
from pymongo import MongoClient

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
print("MONGO_URI Loaded:", MONGO_URI)

client = MongoClient(MONGO_URI)
db = client["auction_db"]
users_collection = db["users"]


@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()

    if users_collection.find_one({'email': data['email']}):
        return jsonify({'status': 'fail', 'message': 'Email already registered'}), 409

    # 🔐 Hash password
    hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
    data['password'] = hashed_password.decode('utf-8')

    # ❌ Remove confirmPassword before saving
    data.pop('confirmPassword', None)

    data['timestamp'] = datetime.datetime.now().isoformat()
    users_collection.insert_one(data)

    return jsonify({'status': 'success', 'message': 'Registration successful'}), 201



@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = users_collection.find_one({'email': data['email']})

    if user and bcrypt.checkpw(data['password'].encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'status': 'success', 'message': 'Login successful', 'user': {'email': user['email']}}), 200
    else:
        return jsonify({'status': 'fail', 'message': 'Invalid email or password'}), 401

@app.route('/')
def home():
    return "Flask with MongoDB backend is live!"

if __name__ == '__main__':
    app.run(debug=True)
