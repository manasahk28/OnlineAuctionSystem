from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import datetime
import bcrypt  
from dotenv import load_dotenv
import os

app = Flask(__name__)
CORS(app)

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
print("MONGO_URI Loaded:", MONGO_URI)

client = MongoClient(MONGO_URI)
db = client["auction_db"]
users_collection = db["users"]
profiles_collection = db["profiles"]

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()

    if users_collection.find_one({'email': data['email']}):
        return jsonify({'status': 'fail', 'message': 'Email already registered'}), 409

    hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
    data['password'] = hashed_password.decode('utf-8')
    data.pop('confirmPassword', None)
    data['timestamp'] = datetime.datetime.now().isoformat()

    users_collection.insert_one({
        'email': data['email'],
        'password': data['password'],
        'timestamp': data['timestamp'],
        'UserName': data.get('UserName', ''),
        'collegeId': data.get('collegeId', ''),
        'collegeName': data.get('collegeName', '')
    })

    profiles_collection.insert_one({
        'email': data['email'],
        'UserName': data.get('UserName', ''),
        'collegeId': data.get('collegeId', ''),
        'collegeName': data.get('collegeName', ''),
        'phone': '',
        'profileImage': '',
        'linkedin': '',
        'createdAt': data['timestamp']
    })

    return jsonify({'status': 'success', 'message': 'Registration successful'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = users_collection.find_one({'email': data['email']})

    if user and bcrypt.checkpw(data['password'].encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'status': 'success', 'message': 'Login successful', 'user': {'email': user['email']}}), 200
    else:
        return jsonify({'status': 'fail', 'message': 'Invalid email or password'}), 401


@app.route('/api/get-profile', methods=['GET'])
def get_profile():
    email = request.args.get('email')
    if not email:
        return jsonify({'status': 'fail', 'message': 'Missing email'}), 400

    user = users_collection.find_one({'email': email})
    profile = profiles_collection.find_one({'email': email})

    if not user:
        return jsonify({'status': 'fail', 'message': 'User not found'}), 404

    # Safely fallback for each field
    combined = {
        'email': user.get('email', ''),
        'timestamp': profile.get('createdAt', user.get('timestamp', '')) if profile else user.get('timestamp', ''),
        'UserName': (profile.get('UserName') if profile and profile.get('UserName') else user.get('UserName', '')),
        'collegeId': (profile.get('collegeId') if profile and profile.get('collegeId') else user.get('collegeId', '')),
        'collegeName': (profile.get('collegeName') if profile and profile.get('collegeName') else user.get('collegeName', '')),
        'phone': profile.get('phone', '') if profile else '',
        'linkedin': profile.get('linkedin', '') if profile else '',
        'profileImage': profile.get('profileImage', '') if profile else ''
    }

    return jsonify({'status': 'success', 'profile': combined}), 200


@app.route('/api/update-profile', methods=['PUT'])
def update_profile():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({'status': 'fail', 'message': 'Email required'}), 400

    profile_fields = {
        "UserName": data.get("UserName", ''),
        "collegeId": data.get("collegeId", ''),
        "collegeName": data.get("collegeName", ''),
        "phone": data.get("phone", ''),
        "linkedin": data.get("linkedin", ''),
        "profileImage": data.get("profileImage", '')
    }
    profiles_collection.update_one({'email': email}, {'$set': profile_fields}, upsert=True)

    users_update = {
        'UserName': data.get('UserName', ''),
        'collegeId': data.get('collegeId', ''),
        'collegeName': data.get('collegeName', '')
    }

    if data.get("password"):
        hashed = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
        users_update['password'] = hashed.decode('utf-8')

    users_collection.update_one({'email': email}, {'$set': users_update})

    return jsonify({'status': 'success', 'message': 'Profile updated'}), 200

@app.route('/')
def home():
    return "Flask with MongoDB backend is live!"

if __name__ == '__main__':
    app.run(debug=True)
