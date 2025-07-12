from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from pymongo import MongoClient
import bcrypt
from dotenv import load_dotenv
import re
import os
from bson import ObjectId
from App.routes.listings import listings_bp
from dotenv import load_dotenv
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from bson.errors import InvalidId
from flask import request, jsonify
import secrets
from flask_mail import Mail, Message
from werkzeug.exceptions import RequestEntityTooLarge

app = Flask(__name__)
CORS(app)

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
print("MONGO_URI Loaded:", MONGO_URI)
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret")

app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB

app.config["JWT_SECRET_KEY"] = JWT_SECRET
jwt = JWTManager(app)

app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'manasahk736@gmail.com'
app.config['MAIL_PASSWORD'] = 'tcrzievvdexxowqp'
app.config['MAIL_DEFAULT_SENDER'] = 'manasahk736@gmail.com'

mail = Mail(app)

client = MongoClient(MONGO_URI)
db = client["auction_db"]
users_collection = db["users"]
user_emails = [user['email'] for user in users_collection.find({}, {"email": 1}) if "@" in user.get("email", "")]
profiles_collection = db["profiles"]
items_collection = db["items"]
bids_collection = db["bids"]
notifications_collection = db["notifications"]
notifications_collection.create_index('email')
reset_tokens_collection = db["reset_tokens"]
preferences_collection = db["preferences"]

category_codes = {
    'Electronics': 'ELEC',
    'Books': 'BOOK',
    'Clothing': 'CLOTH',
    'Stationery': 'STAT',
    'Lab Equipment': 'LAB',
    'Sports Gear': 'SPORT',
    'Hostel Essentials': 'HOST',
    'Cycle/Bike Accessories': 'BIKE',
    'Art Supplies': 'ART',
    'Other': 'MISC'
}

@app.errorhandler(RequestEntityTooLarge)
def handle_file_too_large(e):
    return jsonify({
        "status": "fail",
        "message": "Uploaded file is too large! Max allowed is 50MB."
    }), 413

# 💫 Recursive function to convert all ObjectIds to strings
def convert_objectids(obj):
    if isinstance(obj, list):
        return [convert_objectids(item) for item in obj]
    elif isinstance(obj, dict):
        return {key: convert_objectids(value) for key, value in obj.items()}
    elif isinstance(obj, ObjectId):
        return str(obj)
    else:
        return obj

@app.route('/test-email')
def test_email():
    try:
        msg = Message(
            subject="🎯 Hello from Auction System!",
            recipients=["youremail@gmail.com"],
            body="Hi Mansi! This is a test email from your auction backend 💌"
        )
        mail.send(msg)
        return "✅ Email sent successfully!"
    except Exception as e:
        return f"❌ Email sending failed: {str(e)}"

def send_email(subject, recipients, body):
    try:
        msg = Message(subject=subject, recipients=[recipients], body=body)
        mail.send(msg)
        print(f"✅ Email sent to {recipients}")
    except Exception as e:
        print("❌ Error sending email:", e)

# Loop through all items missing a custom_item_id
for item in items_collection.find({'custom_item_id': {'$exists': True}}):
    if not item['custom_item_id'].startswith('AUC'):
        updated_id = f"AUC{item['custom_item_id']}"
        items_collection.update_one({'_id': item['_id']}, {'$set': {'custom_item_id': updated_id}})
        print(f"Updated: {item['title']} -> {updated_id}")


# Insert Admin
admin_email = "admin@uni.edu.in"
admin_password = "admin_password"
if not users_collection.find_one({"email": admin_email}):
    admin_user = {
        "email": admin_email,
        "password": bcrypt.hashpw(admin_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
        "UserName": "Admin",
        "is_admin": True
    }
    users_collection.insert_one(admin_user)
    print("✅ Admin user inserted")
else:
    print("ℹ️ Admin user already exists")


@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()

    if users_collection.find_one({'email': data['email']}):
        return jsonify({'status': 'fail', 'message': 'Email already registered'}), 409

    hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
    data['password'] = hashed_password.decode('utf-8')
    data.pop('confirmPassword', None)
    data['timestamp'] = datetime.now().isoformat()


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
    email = data.get('email')
    password = data.get('password')

    user = users_collection.find_one({'email': email})

    if user and bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        access_token = create_access_token(identity=email, expires_delta=timedelta(days=1))

        response_data = {
            'status': 'success',
            'message': 'Login successful',
            'access_token': access_token,  # ✅ return token
            'user': {
                'email': user['email'],
                'UserName': user.get('UserName', ''),
                'collegeId': user.get('collegeId', ''),
                'collegeName': user.get('collegeName', ''),
                'timestamp': user.get('timestamp', ''),
                'is_admin': user.get('is_admin', False)
            }
        }

        if user.get('is_admin'):
            response_data['message'] = 'Admin login successful'
            response_data['admin_dashboard'] = True

        return jsonify(response_data), 200


@app.route('/api/post-item', methods=['POST'])
def post_item():
    data = request.get_json()

    required_fields = [
        'title', 'description', 'category',
        'starting_price', 'minimum_increment',
        'start_date_time', 'end_date_time',
        'seller_id',
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

    #new
    category_codes = {
        'Electronics': 'ELEC',
        'Books': 'BOOK',
        'Clothing': 'CLOTH',
        'Stationery': 'STAT',
        'Lab Equipment': 'LAB',
        'Sports Gear': 'SPORT',
        'Hostel Essentials': 'HOST',
        'Cycle/Bike Accessories': 'BIKE',
        'Art Supplies': 'ART',
        'Other': 'MISC'
    }

    category = data.get('category', 'Other')
    code_prefix = category_codes.get(category, 'GEN')

    # Count items already in that category
    item_count = items_collection.count_documents({'category': category})
    custom_id = f"AUC{code_prefix}-{item_count + 1:03d}"  # e.g. ELEC-001
    #here

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
        'timestamp': datetime.now().isoformat(),
        'custom_item_id': custom_id
    }
    items_collection.insert_one(item)

    # Prepare custom email message
    seller_email = item.get('seller_id')
    item_title = item.get('title')
    item_category = item.get('category')
    starting_price = item.get('starting_price')
    end_time = item.get('end_date_time')

    subject = "🎉 Your item has been listed successfully!"
    body = f"""
Hello {seller_email},

Your item titled "{item_title}" has been successfully posted on the Online Auction System! 🛒✨

📝 Item Summary:
Title: {item_title}
Category: {item_category}
Starting Price: ₹{starting_price}
Auction Ends: {end_time}

You'll start receiving bids soon! 🎯  
Stay tuned and track your auction on your dashboard.

Warm regards,  
Team AuctionVerse 🌟
"""

    # Send the email
    try:
        msg = Message(subject=subject, recipients=[seller_email], body=body)
        mail.send(msg)
        print(f"✅ Email sent to {seller_email}")
    except Exception as e:
        print(f"❌ Email sending failed: {e}")

    # 🎉 Notify all users (except the seller) about the new live auction
    try:
        user_emails = [
            user['email'] for user in db.users.find({}, {"email": 1})
            if "@" in user.get("email", "") and user.get("email") != seller_email
        ]

        subject_all = "📢 New Auction Live Now!"
        body_all = f"""
Hello there! 👋

A new auction item has just gone live on AuctionVerse! 🛍️

🆕 Item: {item_title}
📂 Category: {item_category}
💰 Starting Price: ₹{starting_price}
⏰ Ends On: {end_time}

🔥 Head over to the platform and place your bids before time runs out!

Cheers,  
Team AuctionVerse 🌟
""".strip()

        for email in user_emails:
            try:
                msg_all = Message(subject=subject_all, recipients=[email], body=body_all)
                mail.send(msg_all)
                print(f"📧 New auction alert sent to {email}")
            except Exception as e:
                print(f"❌ Failed to send to {email}: {e}")

    except Exception as e:
        print(f"❌ Error notifying users about new auction: {e}")

    return jsonify({'status': 'success', 'message': 'Item posted successfully!'}), 201

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

        # Get current IST time
        ist_time = datetime.now(ZoneInfo("Asia/Kolkata")).isoformat()

        bid_amount = float(bid_amount)
        # Check latest bid from bids_collection
        bids = list(bids_collection.find({'item_id': item_id}))
        
        if bids:
            # Sort bids by amount desc, then timestamp asc
            bids.sort(key=lambda b: (-float(b['bid_amount']), b['timestamp']))
            current_highest = float(bids[0]['bid_amount'])
        else:
            current_highest = float(item.get('starting_price', 0))


        if bid_amount <= current_highest:
            return jsonify({'status': 'fail', 'message': 'Bid must be higher than current highest bid'}), 400

        user_doc = users_collection.find_one({'email': bidder_email})
        # Prepare bid data
        bid_data = {
            'bid_amount': bid_amount,
            'bidder_email': bidder_email,
            'bidder_id': bidder_id,
            'bidder_UserName': user_doc.get('UserName', '') if user_doc else '',
            'timestamp': ist_time,
            'item_id': item_id,
            'item_title': item.get('title', ''),
            'seller_email': item.get('seller_id', ''),
            'outbid': False  # This is the new highest bid
        }

        # Mark all previous bids on this item as outbid
        bids_collection.update_many(
            {'item_id': item_id, 'bidder_email': {'$ne': bidder_email}},
            {'$set': {'outbid': True}}
        )

        # Save bid globally
        bids_collection.insert_one(bid_data)

        # Append to embedded bids array
        bids = item.get('bids', [])
        bids.append(bid_data)

        # Update item with new highest bid and bids
        items_collection.update_one(
            {'_id': ObjectId(item_id)},
            {
                '$set': {
                    'bids': bids,
                    'highest_bid': bid_amount
                }
            }
        )

        return jsonify({'status': 'success', 'message': 'Bid placed successfully'}), 200

    except Exception as e:
        print("❌ Error placing bid:", e)
        return jsonify({'status': 'fail', 'message': 'Internal server error'}), 500

@app.route('/admin/fix-old-bidder-usernames', methods=['POST'])
def fix_old_bidder_usernames():
    try:
        updated_count = 0

        # 🔍 Find bids with missing/blank username
        bids = bids_collection.find({
            '$or': [
                {'bidder_UserName': {'$exists': False}},
                {'bidder_UserName': ''},
                {'bidder_UserName': None}
            ]
        })

        for bid in bids:
            email = bid.get('bidder_email')
            if not email:
                continue  # Skip if no email

            # 🧠 Get username from users collection
            user = users_collection.find_one({'email': email})
            if user:
                username = user.get('UserName')
                if not username or username.strip() == '':
                    username = email.split('@')[0]  # fallback to email prefix
            else:
                username = email.split('@')[0]  # fallback if user not found

            # ✅ Update the bid with username
            bids_collection.update_one(
                {'_id': bid['_id']},
                {'$set': {'bidder_UserName': username}}
            )
            updated_count += 1

        return jsonify({
            'status': 'success',
            'message': f'✅ Fixed {updated_count} old bids with proper usernames'
        }), 200

    except Exception as e:
        print("❌ Error in fix_old_bidder_usernames:", e)
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/item/<item_id>/highest-bid', methods=['GET'])
def get_highest_bid(item_id):
    try:
        print("📦 Incoming item_id:", item_id)

        # Step 1: Get the item
        item = items_collection.find_one({'_id': ObjectId(item_id)})
        if not item:
            return jsonify({'status': 'fail', 'message': 'Item not found'}), 404

        starting_price = float(item.get('starting_price', 0))

        # Step 2: Find all bids on this item
        bids = list(bids_collection.find({'item_id': str(item_id)}))

        if not bids:
            # No bids yet, return starting price
            return jsonify({
                "status": "success",
                "no_bids": True,
                "starting_price": 1200,
                "bidder_id": None,
                "bidder_username": None,
                "timestamp": None
            }), 200

        # Step 3: Find highest bid by bid_amount and timestamp (ascending)
        bids.sort(key=lambda b: (-float(b['bid_amount']), b['timestamp']))

        highest_bid = bids[0]  # This will be the highest by amount, then by earliest time

        user_name = highest_bid.get('bidder_UserName')
        if not user_name:
            email = highest_bid.get('bidder_email')
            user = users_collection.find_one({'email': email})
            user_name = user.get('UserName') if user else email.split('@')[0]
        
        return jsonify({
            'status': 'success',
            'bid_amount': highest_bid['bid_amount'],
            'bidder_id': highest_bid.get('bidder_id'),
            'bidder_username': user_name,
            'timestamp': highest_bid.get('timestamp')
        })

    except Exception as e:
        print("❌ Error fetching highest bid:", e)
        return jsonify({'status': 'fail', 'message': str(e)}), 500

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
    search = request.args.get('search', '').strip()
    categories = request.args.getlist('category')
    pickup_methods = request.args.getlist('pickup_method')
    item_condition = request.args.getlist('item_condition')
    time_filter = request.args.get('time_filter', '').strip()  # New time filter

    query = {}

    if search:
        search_base = re.escape(search.rstrip('s'))
        query['title'] = {'$regex': f'{search_base}s?', '$options': 'i'}

    if categories:
        query['category'] = {'$in': categories}

    if pickup_methods:
        query['delivery_method'] = {'$in': pickup_methods}

    if item_condition:
        query['item_condition'] = {'$in': item_condition}

    # Get current time in IST
    now = datetime.now(ZoneInfo("Asia/Kolkata"))
    
    # Apply time-based filtering
    if time_filter:
        if time_filter == 'upcoming':
            # Items that haven't started yet (start_date_time > now)
            query['start_date_time'] = {'$gt': now.isoformat()}
        elif time_filter == 'live':
            # Items currently active (start_date_time <= now <= end_date_time)
            query['$and'] = [
                {'start_date_time': {'$lte': now.isoformat()}},
                {'end_date_time': {'$gte': now.isoformat()}}
            ]
        elif time_filter == 'ended':
            # Items that have ended (end_date_time < now)
            query['end_date_time'] = {'$lt': now.isoformat()}

    items = list(items_collection.find(query))

    for item in items:
        item['_id'] = str(item['_id'])  # ✅ Convert _id to string
        if 'images' in item and isinstance(item['images'], list) and item['images']:
            item['thumbnail'] = item['images'][0]
        else:
            item['thumbnail'] = ''

        # Add time status for frontend display
        try:
            start_time = datetime.fromisoformat(item.get('start_date_time', '')).astimezone(ZoneInfo("Asia/Kolkata"))
            end_time = datetime.fromisoformat(item.get('end_date_time', '')).astimezone(ZoneInfo("Asia/Kolkata"))
            
            if now < start_time:
                item['time_status'] = 'upcoming'
                item['time_status_text'] = 'Upcoming'
            elif now <= end_time:
                item['time_status'] = 'live'
                item['time_status_text'] = 'Live'
            else:
                item['time_status'] = 'ended'
                item['time_status_text'] = 'Ended'
        except:
            item['time_status'] = 'unknown'
            item['time_status_text'] = 'Unknown'

        # 👇 Also check if item contains any embedded `ObjectId` in other fields (like nested bids)
        if 'bids' in item:
            for bid in item['bids']:
                bid['timestamp'] = bid.get('timestamp', '')
                if '_id' in bid:
                    bid['_id'] = str(bid['_id'])  # Just in case
    return jsonify({'status': 'success', 'items': items}), 200


@app.route('/api/item/<item_id>', methods=['GET'])
def get_single_item(item_id):
    try:
        # 🛡️ Ensure item_id is a valid ObjectId
        try:
            item_id = ObjectId(item_id)
        except InvalidId:
            return jsonify({'status': 'fail', 'message': 'Invalid item ID'}), 400

        # 🔍 Find the item
        item = items_collection.find_one({'_id': item_id})
        if not item:
            return jsonify({'status': 'fail', 'message': 'Item not found'}), 404

        # ➕ Generate custom_item_id if missing
        if 'custom_item_id' not in item:
            category = item.get('category', 'Other')
            prefix = category_codes.get(category, 'GEN')
            count = items_collection.count_documents({'category': category, 'custom_item_id': {'$exists': True}})
            custom_id = f"{prefix}-{count + 1:03d}"
            items_collection.update_one({'_id': item['_id']}, {'$set': {'custom_item_id': custom_id}})
            item['custom_item_id'] = custom_id

        # 🧹 Convert _id to string
        item['_id'] = str(item['_id'])

        # ✅ Convert nested ObjectIds (like in 'bids' field)
        if 'bids' in item:
            for bid in item['bids']:
                if '_id' in bid:
                    bid['_id'] = str(bid['_id'])

        return jsonify({'status': 'success', 'item': item}), 200

    except Exception as e:
        print("❌ Error in get_single_item:", e)
        return jsonify({'status': 'fail', 'message': 'Internal server error'}), 500


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

# 🛠 Your updated route
@app.route('/api/items/user/<email>', methods=['GET'])
def get_user_items(email):
    try:
        user_items = list(items_collection.find({'seller_id': email}))

        for item in user_items:
            # ✅ Ensure _id is a string BEFORE using it
            item['_id'] = str(item['_id'])

            # 💡 Check and generate custom_item_id if missing
            if 'custom_item_id' not in item:
                category = item.get('category', 'Other')
                prefix = category_codes.get(category, 'GEN')
                count = items_collection.count_documents({
                    'category': category,
                    'custom_item_id': {'$exists': True}
                })
                custom_id = f"AUC       {prefix}-{count + 1:03d}"
                items_collection.update_one(
                    {'_id': ObjectId(item['_id'])},
                    {'$set': {'custom_item_id': custom_id}}
                )
                item['custom_item_id'] = custom_id

        # 🧙 Convert any remaining ObjectIds
        user_items = convert_objectids(user_items)

        return jsonify({'status': 'success', 'items': user_items}), 200

    except Exception as e:
        print("❌ ERROR:", e)
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/items/<item_id>', methods=['GET'])
def get_edit_item(item_id):
    try:
        item = items_collection.find_one({'_id': ObjectId(item_id)})
        if not item:
            return jsonify({'status': 'fail', 'message': 'Item not found'}), 404
        item['_id'] = str(item['_id'])  # serialize ObjectId
        return jsonify({'status': 'success', 'item': item}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

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
        # Get all bids by user
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
                end_time_str = item.get('end_date_time')
                auction_result = 'ongoing'  # default state

                try:
                    # Parse item end time to datetime
                    end_time = datetime.fromisoformat(end_time_str).astimezone(ZoneInfo("Asia/Kolkata"))
                    now = datetime.now(ZoneInfo("Asia/Kolkata"))

                    if now > end_time:
                        # Auction has ended
                        highest_bid = float(item.get('highest_bid', item.get('starting_price', 0)))
                        user_bid = float(bid.get('bid_amount', 0))

                        if user_bid >= highest_bid and not bid.get('outbid', False):
                            auction_result = 'won'
                        else:
                            auction_result = 'lost'
                    else:
                        auction_result = 'ongoing'

                except Exception as e:
                    print("❌ Date parsing error:", e)
                    auction_result = 'unknown'

                result.append({
                    '_id': str(item['_id']),
                    'title': item.get('title'),
                    'images': item.get('images', []),
                    'highest_bid': item.get('highest_bid', item.get('starting_price', 0)),
                    'your_bid': bid.get('bid_amount'),
                    'end_time': item.get('end_date_time'),
                    'outbid': bid.get('outbid', False),
                    'seller_email': bid.get('seller_email', ''),
                    'timestamp': bid.get('timestamp', ''),
                    'auction_result': auction_result  # ✅ NEW field
                })

        return jsonify(result), 200

    except Exception as e:
        print("❌ Error in get_my_bids_by_email:", e)
        return jsonify({'error': str(e)}), 500

@app.route('/api/contact', methods=['POST'])
def contact():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    message = data.get('message')

    if not all([name, email, message]):
        return jsonify({'message': 'All fields are required'}), 400

    # Save to contact collection ✅
    db.contact.insert_one({
        'name': name,
        'email': email,
        'message': message,
        'timestamp': datetime.now().isoformat()
    })

    return jsonify({'message': 'Message received'}), 200

@listings_bp.route('/user-category-stats/<email>', methods=['GET'])
def get_user_category_stats(email):
    try:
        from bson import ObjectId

        # =====================
        # 1. PIE CHART DATA: Category distribution of ALL posted items
        # =====================
        pipeline = [
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        posted_stats = list(db.items.aggregate(pipeline))

        pie_chart_data = [
            {"category": doc["_id"], "count": doc["count"]}
            for doc in posted_stats if doc["_id"] is not None
        ]

        # =====================
        # 2. BAR CHART DATA: Category distribution of items user has bid on
        # =====================
        user_bids = list(db.bids.find({"bidder_email": email}))
        item_ids = list({bid["item_id"] for bid in user_bids})

        object_ids = [ObjectId(id) for id in item_ids]
        items = list(db.items.find({"_id": {"$in": object_ids}}))

        bidded_category_count = {}
        for item in items:
            category = item.get("category", "Uncategorized")
            bidded_category_count[category] = bidded_category_count.get(category, 0) + 1

        bar_chart_data = [
            {"category": k, "count": v} for k, v in bidded_category_count.items()
        ]

        return jsonify({
            "status": "success",
            "pie_data": pie_chart_data,
            "bar_data": bar_chart_data
        })

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route('/api/handle-auction-win', methods=['POST'])
def handle_auction_win():
    try:
        data = request.get_json()
        item_id = data.get("item_id")
        bidder_email = data.get("bidder_email")

        if not item_id or not bidder_email:
            return jsonify({"status": "fail", "message": "Missing item_id or bidder_email"}), 400

        item = db.items.find_one({"_id": ObjectId(item_id)})
        if not item:
            return jsonify({"status": "fail", "message": "Item not found"}), 404

        end_time_str = item.get("end_date_time")
        if not end_time_str:
            return jsonify({"status": "fail", "message": "Missing auction end time"}), 400

        now = datetime.now(ZoneInfo("Asia/Kolkata"))
        end_time = datetime.fromisoformat(end_time_str).astimezone(ZoneInfo("Asia/Kolkata"))

        if now <= end_time:
            return jsonify({"status": "fail", "message": "Auction still ongoing"}), 400

        bid = db.bids.find_one(
            {"item_id": item_id, "bidder_email": bidder_email},
            sort=[("timestamp", -1)]
        )

        if not bid:
            return jsonify({"status": "fail", "message": "No bid found for this user"}), 404

        highest_bid = float(item.get("highest_bid", item.get("starting_price", 0)))
        user_bid = float(bid.get("bid_amount", 0))

        if user_bid < highest_bid or bid.get("outbid", False):
            return jsonify({"status": "fail", "message": "User did not win the auction"}), 403

        # Common values
        seller_email = item.get("seller_id", "")
        item_title = item.get("title", "")
        item_category = item.get("category", "N/A")

        # Check if payment already exists
        seller_email = item.get("seller_id", "")
        item_title = item.get("title", "")
        item_category = item.get("category", "N/A")

        # Check if payment already exists
        existing = db.payments.find_one({
            "item_id": item_id,
            "buyer_email": bidder_email
        })

        if not existing:
            db.payments.insert_one({
                "buyer_email": bidder_email,
                "seller_email": seller_email,
                "item_title": item_title,
                "item_id": item_id,
                "amount": user_bid,
                "status": "Pending",
                "timestamp": now.isoformat()
            })

            db.notifications.insert_one({
                "email": seller_email,
                "type": "payment_pending",
                "message": f"{bidder_email} won your item '{item_title}' and payment is pending.",
                "item_id": item_id,
                "read": False,
                "timestamp": now.isoformat(),
                "actionable": True
            })

            # 📨 Email to Winner
            try:
                subject = "🎉 Congratulations! You won the auction!"
                body = f"""
Hello {bidder_email},

You did it! 🥳  
You've won the auction for "{item_title}" with a final bid of ₹{user_bid}! 🛍️

📦 Item Details:
Title: {item_title}
Category: {item_category}
Final Price: ₹{user_bid}
Seller: {seller_email}

🎯 What's next?
Please contact the seller immediately at 📧 {seller_email} to arrange payment and pickup/delivery.

⏰ Complete the handover within the next 48 hours to avoid delays.

If you have any questions, reply to this email or contact support.

Happy shopping,  
Team AuctionVerse 🌟
""".strip()

                msg = Message(subject=subject, recipients=[bidder_email], body=body)
                mail.send(msg)
                print(f"✅ Winner email sent to {bidder_email}")
            except Exception as e:
                print(f"❌ Failed to send winner email: {e}")

            # 📬 Email to Seller
            if not seller_email or "@" not in seller_email:
                print("❌ Seller email is invalid. Skipping seller email.")
            else:
                try:
                    subject_seller = "📢 Your item has been sold!"
                    body_seller = f"""
Hello {seller_email},

Great news! 🎉  
Your auction item "{item_title}" has been won by {bidder_email} with a final bid of ₹{user_bid}.

🛍️ Item Summary:
Title: {item_title}
Category: {item_category}
Final Price: ₹{user_bid}
Buyer Email: {bidder_email}

📞 Please contact the buyer as soon as possible to complete the transaction.

⏰ Complete the handover within the next 48 hours.

Thank you for using AuctionVerse 🧡  

Happy Selling!  
Team AuctionVerse 🌟
""".strip()

                    msg_seller = Message(subject=subject_seller, recipients=[seller_email], body=body_seller)
                    mail.send(msg_seller)
                    print(f"✅ Seller email sent to {seller_email}")
                except Exception as e:
                    print(f"❌ Failed to send seller email: {e}")

        return jsonify({
            "status": "success",
            "message": "Payment created, emails sent to both seller and winner!"
        }), 200

    except Exception as e:
        print("❌ Error in handle_auction_win:", e)
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/payments/<buyer_email>', methods=['GET'])
def get_user_payments(buyer_email):
    try:
        payments = list(db.payments.find({'buyer_email': buyer_email}))
        for p in payments:
            p['_id'] = str(p['_id'])
        return jsonify({'status': 'success', 'payments': payments}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/confirm-payment', methods=['POST'])
def confirm_payment():
    try:
        data = request.get_json()
        item_id = data.get("item_id")
        seller_email = data.get("seller_email")

        if not item_id or not seller_email:
            return jsonify({"status": "fail", "message": "Missing item_id or seller_email"}), 400

        # Find the pending payment record
        payment = db.payments.find_one({
            "item_id": item_id,
            "seller_email": seller_email,
            "status": "Pending"
        })

        if not payment:
            return jsonify({"status": "fail", "message": "No pending payment found"}), 404

        # Mark the payment as paid
        db.payments.update_one(
            {"_id": payment["_id"]},
            {"$set": {"status": "Paid", "confirmed_at": datetime.now(ZoneInfo("Asia/Kolkata")).isoformat()}}
        )

        # Send notification to buyer
        db.notifications.insert_one({
            "email": payment["buyer_email"],
            "type": "payment_confirmed",
            "message": f"Your payment for '{payment['item_title']}' has been confirmed by the seller.",
            "item_id": item_id,
            "read": False,
            "timestamp": datetime.now(ZoneInfo("Asia/Kolkata")).isoformat(),
            "actionable": False
        })

        return jsonify({"status": "success", "message": "Payment confirmed and buyer notified"}), 200

    except Exception as e:
        print("❌ Error in confirm_payment:", e)
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route('/api/items/approve/<item_id>', methods=['PUT'])
def approve_reject_item(item_id):
    try:
        status = request.args.get('status')  # "Approved" or "Rejected"
        is_approved = request.args.get('is_approved')  # "true" or "false"

        if not status or is_approved is None:
            return jsonify({'message': 'Missing status or is_approved param'}), 400

        update_fields = {
            "status": status,
            "is_approved": is_approved.lower() == "true"
        }

        result = items_collection.update_one(
            {"_id": ObjectId(item_id)},
            {"$set": update_fields}
        )

        if result.matched_count == 0:
            return jsonify({'message': 'Item not found'}), 404

        return jsonify({'message': f'Item {status} successfully'}), 200

    except Exception as e:
        print("❌ Error in approval route:", e)
        return jsonify({'message': 'Internal server error'}), 500

@app.route('/api/admin/comment', methods=['POST'])
def send_admin_comment():
    data = request.get_json()
    item_id = data.get("itemId")
    seller_email = data.get("sellerId")
    comment = data.get("comment")

    if not item_id or not seller_email or not comment:
        return jsonify({"status": "fail", "message": "Missing fields"}), 400

    db.notifications.insert_one({
        "email": seller_email,
        "type": "admin_comment",
        "message": f"Admin comment on your item: {comment}",
        "item_id": item_id,
        "read": False,
        "timestamp": datetime.now().isoformat()
    })

    return jsonify({"status": "success", "message": "Comment sent to seller"}), 200

# ======================
# GET notifications for user
# ======================
@app.route('/api/notifications/<email>', methods=['GET'])
def get_notifications(email):
    user_notifications = list(
        notifications_collection
        .find({'email': email})
        .sort('timestamp', -1)
    )
    for n in user_notifications:
        n['_id'] = str(n['_id'])
    return jsonify({'status': 'success', 'notifications': user_notifications}), 200


# ======================
# Add new notification
# ======================
@app.route('/api/notifications/add', methods=['POST'])
def add_notification():
    data = request.get_json()
    email = data.get('email')
    message = data.get('message')
    n_type = data.get('type', 'general')

    if not email or not message:
        return jsonify({'status': 'fail', 'message': 'Missing email or message'}), 400

    # Respect user preferences
    prefs = preferences_collection.find_one({'email': email})
    if prefs and not prefs.get(f'enable_{n_type}', True):
        return jsonify({'status': 'skipped', 'message': f'{n_type} notifications disabled by user'}), 200

    notifications_collection.insert_one({
        'email': email,
        'message': message,
        'type': n_type,
        'seen': False,
        'timestamp': datetime.now(ZoneInfo("Asia/Kolkata")).isoformat()
    })
    return jsonify({'status': 'success', 'message': 'Notification added'}), 200


# ======================
# Mark notification as seen
# ======================
@app.route('/api/notifications/mark_seen', methods=['POST'])
def mark_notification_seen():
    data = request.get_json()
    notification_id = data.get('notification_id')

    if not notification_id:
        return jsonify({'status': 'fail', 'message': 'Missing notification_id'}), 400

    notifications_collection.update_one(
        {'_id': ObjectId(notification_id)},
        {'$set': {'seen': True}}
    )
    return jsonify({'status': 'success', 'message': 'Notification marked as seen'}), 200


# ======================
# Get user preferences
# ======================
@app.route('/api/notifications/preferences/<email>', methods=['GET'])
@jwt_required()
def get_notification_preferences(email):
    prefs = preferences_collection.find_one({'email': email})
    if not prefs:
        prefs = {
            'enable_outbid': True,
            'enable_auction_end': True,
            'enable_winner': True,
            'enable_new_item': True,
            'enable_payment': True,
            'enable_admin_comment': True  # ✅ include this
        }
        preferences_collection.insert_one({"email": email, **prefs})
    prefs.pop('_id', None)
    return jsonify({'status': 'success', 'preferences': prefs})


# ======================
# Update user preferences
# ======================
@app.route('/api/notifications/preferences/update', methods=['POST'])
@jwt_required()
def update_notification_preferences():
    data = request.get_json()
    email = data.get('email')
    updates = data.get('preferences', {})

    if not email or not isinstance(updates, dict):
        return jsonify({'status': 'fail', 'message': 'Invalid request'}), 400

    preferences_collection.update_one(
        {'email': email},
        {'$set': updates},
        upsert=True
    )
    return jsonify({'status': 'success', 'message': 'Preferences updated'}), 200


# ======================
# Reusable helper to send notification
# ======================
def send_notification_if_allowed(email, message, n_type='general'):
    prefs = preferences_collection.find_one({'email': email})
    if prefs and not prefs.get(f'enable_{n_type}', True):
        return False

    notifications_collection.insert_one({
        'email': email,
        'message': message,
        'type': n_type,
        'seen': False,
        'timestamp': datetime.now(ZoneInfo("Asia/Kolkata")).isoformat()
    })
    return True

@app.route('/api/chatbot', methods=['POST'])
def chatbot():
    data = request.get_json()
    message = data.get('message', '').strip().lower()
    user_email = data.get('email', '').strip().lower()

    # 🔧 Simple typo corrections
    message = message.replace("preent", "present").replace("staionary", "stationery").replace("art supllies", "art supplies")

    # 📌 Category/item keywords
    item_keywords = ["stationery", "art supplies", "books", "television", "laptop", "bag", "furniture", "phone", "sketch book"]

    for keyword in item_keywords:
        if keyword in message:
            found = db.items.count_documents({
                "$or": [
                    {"category": {"$regex": keyword, "$options": "i"}},
                    {"title": {"$regex": keyword, "$options": "i"}},
                    {"tags": {"$regex": keyword, "$options": "i"}},
                    {"description": {"$regex": keyword, "$options": "i"}}
                ]
            })
            if found > 0:
                return jsonify({"response": f"Yes! We have {found} item(s) related to '{keyword}'. 🔍"})
            else:
                return jsonify({"response": f"Sorry, no items found for '{keyword}' at the moment. 🙁"})

    # 📊 Total item count
    if re.search(r"(total items|how many items.*total|how many products)", message):
        total = db.items.count_documents({})
        return jsonify({"response": f"We currently have {total} item(s) listed in total. 🛒"})

    # 📈 Bidding stats
    if re.search(r"how many items.*(bid|bidded|bidding)", message) and user_email:
        bid_count = db.bids.count_documents({"bidder_email": user_email})
        return jsonify({"response": f"You have placed bids on {bid_count} item(s) so far. 🔥"})

    # 📤 Posted item stats
    if re.search(r"how many items.*(posted|listed)", message) and user_email:
        post_count = db.items.count_documents({"seller_email": user_email})
        return jsonify({"response": f"You have posted {post_count} item(s) for auction. 📦"})

    # ❓ Default fallback
    return jsonify({
        "response": "Hmm... I’m still learning. Try asking about items, bidding, or listings! 🧠"
    })

# ------------------ Forgot/Reset Password Routes ------------------

@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')

    user = users_collection.find_one({'email': email})
    if not user:
        return jsonify({'status': 'fail', 'message': 'Email not registered'}), 404

    token = secrets.token_urlsafe(16)
    expiry = datetime.now(ZoneInfo("Asia/Kolkata")).timestamp() + 600  # 10 mins

    # Clean previous tokens
    reset_tokens_collection.delete_many({'email': email})

    # Save new reset token
    reset_tokens_collection.insert_one({
        'email': email,
        'token': token,
        'expires_at': expiry,
        'used': False,
        'created_at': datetime.now(ZoneInfo("Asia/Kolkata")).isoformat()
    })

    # Since no email service is used, return token for manual use
    return jsonify({
        'status': 'success',
        'message': 'Reset token generated. Use it to reset password.',
        'reset_token': token
    }), 200


@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    new_password = data.get('new_password')
    email = data.get('email')
    token = data.get('reset_token')
    new_password = data.get('new_password')


    # Validate password strength
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
        return jsonify({
            'status': 'fail',
            'message': 'Password must include uppercase, lowercase, number, special character, and be at least 8 characters'
        }), 400

    token_doc = reset_tokens_collection.find_one({'email': email, 'token': token})
    now_ts = datetime.now(ZoneInfo("Asia/Kolkata")).timestamp()

    if not token_doc:
        return jsonify({'status': 'fail', 'message': 'Invalid token'}), 400

    if token_doc.get('used'):
        return jsonify({'status': 'fail', 'message': 'Token already used'}), 400

    if now_ts > token_doc['expires_at']:
        return jsonify({'status': 'fail', 'message': 'Token expired'}), 400

    # Check if same as old password
    user = users_collection.find_one({'email': email})
    if bcrypt.checkpw(new_password.encode('utf-8'), user['password'].encode('utf-8')):
        return jsonify({'status': 'fail', 'message': 'New password cannot be same as old password'}), 400

    hashed = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    users_collection.update_one({'email': email}, {'$set': {'password': hashed}})

    reset_tokens_collection.update_one(
        {'_id': token_doc['_id']},
        {'$set': {
            'used': True,
            'used_at': datetime.now(ZoneInfo("Asia/Kolkata")).isoformat()
        }}
    )

    access_token = create_access_token(identity=email)

    return jsonify({
        'status': 'success',
        'message': 'Password reset successful',
        'access_token': access_token,
        'email': email
    }), 200

# ------------------ ✅ PROTECTED ROUTE ------------------
@app.route('/api/protected/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    user_email = get_jwt_identity()
    return jsonify({'message': f'Welcome {user_email}, this is a protected route!'}), 200

@app.route('/')
def home():
    return "✅ Flask backend with MongoDB, JWT Auth, and Auction APIs is live!"


app.config["DB"] = db  # ✅ Important to set this before registering blueprint
app.register_blueprint(listings_bp, url_prefix="/api")

if __name__ == '__main__':
    app.run(debug=True, use_reloader=True, extra_files=[], reloader_type='watchdog')

