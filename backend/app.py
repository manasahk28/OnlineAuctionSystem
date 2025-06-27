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
bids_collection = db["bids"]  # NEW: for storing bids

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

    video = data.get('video')
    if video and (not isinstance(video, str) or not video.startswith('data:video')):
        return jsonify({'status': 'fail', 'message': 'Invalid video format'}), 400

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
        'location': data.get('location', ''),
        'pickup_method': data.get('pickup_method', ''),
        'delivery_charge': data.get('delivery_charge', ''),
        'return_policy': data.get('return_policy', ''),
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

from bson.errors import InvalidId

@app.route('/api/place-bid', methods=['POST'])
def place_bid():
    data = request.get_json()
    item_id = data.get('item_id')
    bid_amount = data.get('bid_amount')
    bidder_email = data.get('bidder_email')
    bidder_id = data.get('bidder_id')

    if not all([item_id, bid_amount, bidder_email, bidder_id]):
        return jsonify({'status': 'fail', 'message': 'Missing bid details'}), 400

    try:
        item = items_collection.find_one({'_id': ObjectId(item_id)})
        if not item:
            return jsonify({'status': 'fail', 'message': 'Item not found'}), 404

        bids = item.get('bids', [])

        bids.append({
            'bid_amount': bid_amount,
            'bidder_email': bidder_email,
            'bidder_id': bidder_id,
            'timestamp': datetime.datetime.utcnow().isoformat(),
            'item_id': item_id,
            'item_title': item.get('title', ''),
            'seller_email': item.get('contact_email', '')
        })

        items_collection.update_one(
            {'_id': ObjectId(item_id)},
            {'$set': {'bids': bids}}
        )

        return jsonify({'status': 'success', 'message': 'Bid placed successfully'}), 200

    except Exception as e:
        print("Error placing bid:", e)
        return jsonify({'status': 'fail', 'message': 'Internal server error'}), 500

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
        item['_id'] = str(item['_id'])
        if 'images' in item and isinstance(item['images'], list) and item['images']:
            item['thumbnail'] = item['images'][0]
        else:
            item['thumbnail'] = ''
    return jsonify({'status': 'success', 'items': items}), 200

@app.route('/api/items/<item_id>', methods=['GET'])
def get_single_item(item_id):
    try:
        item = items_collection.find_one({'_id': ObjectId(item_id)})
        if not item:
            return jsonify({'status': 'fail', 'message': 'Item not found'}), 404
        item['_id'] = str(item['_id'])
        return jsonify({'status': 'success', 'item': item}), 200
    except Exception:
        return jsonify({'status': 'fail', 'message': 'Invalid item ID'}), 400

@app.route('/api/items/<string:item_id>', methods=['PUT'])
def update_item(item_id):
    try:
        form_data = request.form
        files = request.files

        update_data = {}

        # Extract form fields
        update_data['title'] = form_data.get('title')
        update_data['description'] = form_data.get('description')
        update_data['category'] = form_data.get('category')
        update_data['tags'] = form_data.get('tags')
        update_data['starting_price'] = form_data.get('starting_price')
        update_data['minimum_increment'] = form_data.get('minimum_increment')
        update_data['buy_now_price'] = form_data.get('buy_now_price')
        update_data['start_date_time'] = form_data.get('start_date_time')
        update_data['end_date_time'] = form_data.get('end_date_time')
        update_data['duration'] = form_data.get('duration')
        update_data['seller_id'] = form_data.get('seller_id')
        update_data['contact_email'] = form_data.get('contact_email')
        update_data['location'] = form_data.get('location')
        update_data['pickup_method'] = form_data.get('pickup_method')
        update_data['delivery_charge'] = form_data.get('delivery_charge')
        update_data['return_policy'] = form_data.get('return_policy')
        update_data['is_approved'] = form_data.get('is_approved') == 'true'
        update_data['status'] = form_data.get('status')
        update_data['terms_accepted'] = form_data.get('terms_accepted') == 'true'
        update_data['report_reason'] = form_data.get('report_reason')
        update_data['highlights'] = form_data.get('highlights')
        update_data['item_condition'] = form_data.get('item_condition')
        update_data['warranty'] = form_data.get('warranty')
        update_data['warranty_duration'] = form_data.get('warranty_duration')
        update_data['damage_description'] = form_data.get('damage_description')
        update_data['limitedCollection'] = form_data.get('limitedCollection') == 'true'

        # Handle uploaded images
        images = request.files.getlist('images')
        image_urls = []
        for image in images:
            if image and image.filename:
                image_urls.append(image.filename)  # Replace with your file saving logic

        if image_urls:
            update_data['images'] = image_urls

        # Handle video upload
        video = request.files.get('video')
        if video and video.filename:
            update_data['video'] = video.filename  # Replace with saving logic

        result = items_collection.update_one({'_id': ObjectId(item_id)}, {'$set': update_data})

        if result.modified_count > 0:
            return jsonify({'status': 'success', 'message': 'Item updated successfully'})
        else:
            return jsonify({'status': 'error', 'message': 'No changes made'}), 400

    except Exception as e:
        print("❌ Error in update_item:", e)
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/items/user/<email>', methods=['GET'])
def get_user_items(email):
    user_items = list(items_collection.find({'seller_id': email}))
    for item in user_items:
        item['_id'] = str(item['_id'])
    return jsonify({'status': 'success', 'items': user_items}), 200

@app.route('/my-bids/<bidder_id>', methods=['GET'])
def get_my_bids(bidder_id):
    try:
        bids = list(db.bids.find({'bidder_id': bidder_id}))

        # Get item IDs
        item_ids = list(set(bid['item_id'] for bid in bids))
        items_map = {
            str(item['_id']): item
            for item in db.items.find({'_id': {'$in': [ObjectId(i) for i in item_ids]}})
        }

        result = []
        for bid in bids:
            item = items_map.get(bid['item_id'])
            if item:
                result.append({
                    '_id': str(item['_id']),
                    'title': item.get('title'),
                    'images': item.get('images', []),
                    'highest_bid': item.get('highest_bid', item.get('base_price', 0)),
                    'your_bid': bid.get('bid_amount'),
                    'end_time': item.get('end_date_time'),  
                    'outbid': bid.get('outbid', False)
                })

        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/my-bids/email/<bidder_email>', methods=['GET'])
def get_my_bids_by_email(bidder_email):
    try:
        bids = list(db.bids.find({'bidder_email': bidder_email}))

        # Keep only latest bid per item_id
        latest_bids = {}
        for bid in sorted(bids, key=lambda x: x.get('timestamp', ''), reverse=True):
            if bid['item_id'] not in latest_bids:
                latest_bids[bid['item_id']] = bid

        item_ids = list(latest_bids.keys())
        items_map = {
            str(item['_id']): item
            for item in db.items.find({'_id': {'$in': [ObjectId(i) for i in item_ids]}})
        }

        result = []
        for item_id, bid in latest_bids.items():
            item = items_map.get(item_id)
            if item:
                result.append({
                    '_id': str(item['_id']),
                    'title': item.get('title'),
                    'images': item.get('images', []),
                    'highest_bid': item.get('highest_bid', item.get('starting_price', 0)),
                    'your_bid': bid.get('bid_amount'),
                    'end_time': item.get('end_date_time'),
                    'outbid': bid.get('outbid', False),
                    'seller_email': bid.get('seller_email', '')
                })

        return jsonify(result), 200

    except Exception as e:
        print("❌ Error in get_my_bids_by_email:", e)
        return jsonify({'error': str(e)}), 500

@app.route('/')
def home():
    return "Flask with MongoDB backend is live!"

if __name__ == '__main__':
    app.run(debug=True)
