from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

protected_bp = Blueprint('protected_bp', __name__)

@protected_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    user_email = get_jwt_identity()
    return jsonify({'message': f'Welcome {user_email}, this is a protected route!'})
