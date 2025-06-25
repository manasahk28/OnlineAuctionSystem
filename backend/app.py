from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import datetime
import bcrypt  
from dotenv import load_dotenv
import os
from bson import ObjectId

app = Flask(__name__)
CORS(app)

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
print("MONGO_URI Loaded:", MONGO_URI)

client = MongoClient(MONGO_URI)
db = client["auction_db"]
users_collection = db["users"]
profiles_collection = db["profiles"]
items_collection = db["items"]

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
        return jsonify({
            'status': 'success',
            'message': 'Login successful',
            'user': {
                'email': user['email'],
                'UserName': user.get('UserName', ''),
                'collegeId': user.get('collegeId', ''),
                'collegeName': user.get('collegeName', ''),
                'timestamp': user.get('timestamp', '')
            }
        }), 200
    else:
        return jsonify({'status': 'fail', 'message': 'Invalid email or password'}), 401

@app.route('/api/post-item', methods=['POST'])
def post_item():
    data = request.get_json()

    required_fields = [
        'title', 'description', 'category',
        'starting_price', 'minimum_increment',
        'start_date_time', 'end_date_time',
        'seller_id', 'contact_email',
        'item_condition', 'pickup_method',
        'terms_accepted'
    ]

    for field in required_fields:
        if field not in data or data[field] in [None, '', [], False]:
            return jsonify({'status': 'fail', 'message': f'Missing required field: {field}'}), 400


    images = data.get('images', [])
    if not isinstance(images, list):
        return jsonify({'status': 'fail', 'message': 'Images must be a list'}), 400

    if len(images) > 3:
        return jsonify({'status': 'fail', 'message': 'You can only upload up to 3 images'}), 400

    for img in images:
        if not isinstance(img, str) or not img.startswith('data:image'):
            return jsonify({'status': 'fail', 'message': 'Invalid image format'}), 400

    # Validate optional video
    video = data.get('video')
    if video and (not isinstance(video, str) or not video.startswith('data:video')):
        return jsonify({'status': 'fail', 'message': 'Invalid video format'}), 400

    # Construct item object with all fields
    item = {
        'title': data.get('title', ''),
        'description': data.get('description', ''),
        'category': data.get('category', ''),
        'tags': data.get('tags', ''),
        'images': images,
        'video': video if video else '',
        'starting_price': data.get('starting_price', ''),
        'minimum_increment': data.get('minimum_increment', ''),
        'buy_now_price': data.get('buy_now_price', ''),
        'start_date_time': data.get('start_date_time', ''),
        'end_date_time': data.get('end_date_time', ''),
        'duration': data.get('duration', ''),
        'seller_id': data.get('seller_id', ''),
        'contact_email': data.get('contact_email', ''),
        'location': data.get('location', ''),
        'pickup_method': data.get('pickup_method', ''),
        'delivery_charge': data.get('delivery_charge', ''),
        'return_policy': data.get('return_policy', ''),
        'is_approved': data.get('is_approved', False),
        'status': data.get('status', 'Draft'),
        'terms_accepted': data.get('terms_accepted', False),
        'report_reason': data.get('report_reason', ''),
        'highlights': data.get('highlights', ''),
        'item_condition': data.get('item_condition', ''),
        'warranty': data.get('warranty', ''),
        'warranty_duration': data.get('warranty_duration', ''),
        'damage_description': data.get('damage_description', ''),
        'limitedCollection': data.get('limitedCollection', False),
        'timestamp': datetime.datetime.now().isoformat()
    }

    items_collection.insert_one(item)
    return jsonify({'status': 'success', 'message': 'Item posted successfully!'}), 201

@app.route('/api/get-profile', methods=['GET'])
def get_profile():
    email = request.args.get('email')
    if not email:
        return jsonify({'status': 'fail', 'message': 'Missing email'}), 400

    user = users_collection.find_one({'email': email})
    profile = profiles_collection.find_one({'email': email})

    if not user:
        return jsonify({'status': 'fail', 'message': 'User not found'}), 404

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

@app.route('/api/items', methods=['GET'])
def get_all_items():
    items = list(items_collection.find())
    for item in items:
        item['_id'] = str(item['_id'])  # Convert ObjectId to string
        if 'images' in item and isinstance(item['images'], list) and item['images']:
            item['thumbnail'] = item['images'][0]  # Use first image as thumbnail
        else:
            item['thumbnail'] = ''  # Default if no image

    return jsonify({'status': 'success', 'items': items}), 200

@app.route('/api/item/<item_id>', methods=['GET'])
def get_single_item(item_id):
    try:
        item = items_collection.find_one({'_id': ObjectId(item_id)})
        if not item:
            return jsonify({'status': 'fail', 'message': 'Item not found'}), 404

        item['_id'] = str(item['_id'])  # Convert ObjectId to string
        return jsonify({'status': 'success', 'item': item}), 200

    except Exception as e:
        return jsonify({'status': 'fail', 'message': 'Invalid item ID'}), 400

@app.route('/api/items/user/<email>', methods=['GET'])
def get_user_items(email):
    try:
        user_items = list(items_collection.find({'userEmail': email}))
        for item in user_items:
            item['_id'] = str(item['_id'])  # Convert ObjectId to string
            item['thumbnail'] = item['images'][0] if item.get('images') else ''
        return jsonify({'status': 'success', 'items': user_items}), 200
    except Exception as e:
        return jsonify({'status': 'fail', 'message': str(e)}), 500


@app.route('/')
def home():
    return "Flask with MongoDB backend is live!"

if __name__ == '__main__':
    app.run(debug=True)
