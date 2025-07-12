from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt
import re

auth_bp = Blueprint('auth_bp', __name__)

# Helper to validate email
def is_valid_email(email):
    return re.match(r"[^@]+@[^@]+\.[^@]+", email)

# -------------------- Register Endpoint --------------------
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    if not is_valid_email(email):
        return jsonify({'error': 'Invalid email format'}), 400

    users_collection = current_app.config['USERS_COLLECTION']
    if users_collection.find_one({'email': email}):
        return jsonify({'error': 'User already exists'}), 409

    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    users_collection.insert_one({
        'email': email,
        'password': hashed_pw.decode('utf-8')
    })

    return jsonify({'message': 'User registered successfully'}), 201

# -------------------- Login Endpoint --------------------
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    users_collection = current_app.config['USERS_COLLECTION']
    user = users_collection.find_one({'email': email})
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        token = create_access_token(identity=email)
        return jsonify({'message': 'Login successful', 'token': token}), 200
    else:
        return jsonify({'error': 'Incorrect password'}), 401

# -------------------- Change Password Endpoint --------------------
@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')

    if not current_password or not new_password:
        return jsonify({'status': 'fail', 'message': 'Current and new password required.'}), 400

    users_collection = current_app.config['USERS_COLLECTION']
    email = get_jwt_identity()
    user = users_collection.find_one({'email': email})
    if not user or not user.get('password'):
        return jsonify({'status': 'fail', 'message': 'User not found or password missing.'}), 404

    # Check current password
    if not bcrypt.checkpw(current_password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'status': 'fail', 'message': 'Current password is incorrect.'}), 401

    # Password strength check
    def is_password_strong(password):
        if len(password) < 8:
            return False
        if not re.search(r'[A-Z]', password):
            return False
        if not re.search(r'[a-z]', password):
            return False
        if not re.search(r'\d', password):
            return False
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            return False
        return True

    if not is_password_strong(new_password):
        return jsonify({'status': 'fail', 'message': 'Password must include uppercase, lowercase, number, special character, and be at least 8 characters'}), 400

    # Check if new password is same as old
    if bcrypt.checkpw(new_password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'status': 'fail', 'message': 'New password cannot be same as old password'}), 400

    # Update password
    hashed = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    users_collection.update_one({'email': email}, {'$set': {'password': hashed}})

    return jsonify({'status': 'success', 'message': 'Password changed successfully!'}), 200