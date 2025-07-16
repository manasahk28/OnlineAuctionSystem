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
from App.routes.auth import auth_bp
import threading
from apscheduler.schedulers.background import BackgroundScheduler
import razorpay
import hmac
import hashlib

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True, allow_headers=["Content-Type", "Authorization"], methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
print("MONGO_URI Loaded:", MONGO_URI)
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret")


# Razorpay credentials
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

# Razorpay client setup
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB

app.config["JWT_SECRET_KEY"] = JWT_SECRET
jwt = JWTManager(app)

app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_DEFAULT_SENDER'] = 'onlineauction25@gmail.com'

mail = Mail(app)

scheduler = BackgroundScheduler()
scheduler.start()

client = MongoClient(MONGO_URI)
db = client["auction_db"]
users_collection = db["users"]
user_emails = [user['email'] for user in users_collection.find({}, {"email": 1}) if "@" in user.get("email", "")]
profiles_collection = db["profiles"]
items_collection = db["items"]
bids_collection = db["bids"]
notifications_collection = db["notifications"]
payments_collection = db['payments']
notifications_collection.create_index('email')
reset_tokens_collection = db["reset_tokens"]
preferences_collection = db["preferences"]

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

# In-memory storage for user activities (in production, use a database)
user_activities = {}

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

@app.route('/api/admin/items/pending', methods=['GET'])
def get_pending_items():
    items = list(items_collection.find({
        "is_approved": False,
        "is_rejected": False
    }))
    print(f"📦 Found {len(items)} pending items")
    converted_items = convert_objectids(items)
    return jsonify(converted_items)

@app.route('/api/admin/items/approved', methods=['GET'])
def get_approved_items():
    items = list(items_collection.find({
        "is_approved": True
    }))
    return jsonify(convert_objectids(items))

@app.route('/api/admin/items/rejected', methods=['GET'])
def get_rejected_items():
    items = list(items_collection.find({
        "is_rejected": True
    }))
    return jsonify(convert_objectids(items))


@app.errorhandler(RequestEntityTooLarge)
def handle_file_too_large(e):
    return jsonify({
        "status": "fail",
        "message": "Uploaded file is too large! Max allowed is 50MB."
    }), 413

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
admin_email = os.getenv("ADMIN_EMAIL")
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
        # access_token = create_access_token(identity=email, expires_delta=timedelta(days=1))
        access_token = create_access_token(identity=email)

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
    else:
        return jsonify({'status': 'fail', 'message': 'Invalid email or password'}), 401

def send_auction_emails(item):
    with app.app_context():  # 🌟 this is the magic line
        try:
            seller_email = item.get('seller_id')
            item_title = item.get('title')
            item_category = item.get('category')
            starting_price = item.get('starting_price')
            end_time = item.get('end_date_time')
            custom_id = item.get('custom_item_id')

            # Admin email
            admin_user = db.users.find_one({"is_admin": True})
            admin_email = admin_user['email'] if admin_user else None

            # 📬 Email to Admin
            if admin_email:
                subject_admin = f"🔎 New Item Awaiting Review: {item_title}"
                body_admin = f"""
Hello Admin,

A new item has been posted by {seller_email} and is awaiting your review. 🕵️‍♀️

📦 Item Details:
Title: {item_title}
Category: {item_category}
Starting Price: ₹{starting_price}
Auction Ends: {end_time}
Seller: {seller_email}

👉 Item ID: {custom_id}

Team AuctionVerse 💛
""".strip()

                msg_admin = Message(subject=subject_admin, recipients=[admin_email], body=body_admin)
                mail.send(msg_admin)
                print(f"✅ Admin email sent to {admin_email}")

        except Exception as e:
            print(f"❌ Error in send_auction_emails: {e}")

@app.route('/api/post-item', methods=['POST'])
def post_item():
    data = request.get_json()
    data['is_approved'] = False
    data['status'] = 'Pending'  # optional but helps to label cleanly
    data['approval_status'] = 'pending'
    data['is_rejected'] = False  
    data['is_approved'] = False

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
    item_count = items_collection.count_documents({'category': category})
    custom_id = f"AUC{code_prefix}-{item_count + 1:03d}"

    item = {
        'title': data.get('title', ''),
        'description': data.get('description', ''),
        'category': category,
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
        'contact_email': data.get('contact_email', ''),
        'timestamp': datetime.now(ZoneInfo("Asia/Kolkata")).isoformat(),
        'custom_item_id': custom_id,

        # ✅ Add this below!
        'is_approved': False,
        'is_rejected': False,
        'approval_status': 'pending',
        'status': 'Pending'

    }

    items_collection.insert_one(item)

    # 📨 Send email to seller immediately
    try:
        seller_email = item['seller_id']
        subject = "📝 Your item has been submitted - awaiting admin approval"
        body = f"""
Hello {seller_email}, 👋

Thank you for submitting your item to AuctionVerse! 🛍️✨  
Your listing "{item['title']}" has been received and is currently pending admin approval. 🔎✅

Once approved, it will go live on the platform and become visible to all users for bidding.

📝 Item Summary:
• Title: {item['title']}
• Category: {item['category']}
• Starting Price: ₹{item['starting_price']}
• Auction Ends: {item['end_date_time']}

🕒 What happens now?
Our team will review your item shortly to ensure it meets our platform guidelines.  
You'll receive a confirmation email once it's approved and live.

💡 You can track the status of your listing in your seller dashboard under “My Listings”.

Thanks for using AuctionVerse — where student auctions come alive! 🎯  

Warm regards,  
Team AuctionVerse 💛
""".strip()

        msg = Message(subject=subject, recipients=[seller_email], body=body)
        mail.send(msg)
        print(f"✅ Seller email sent to {seller_email}")

    except Exception as e:
        print(f"❌ Failed to send seller email: {e}")

    # ✅ Trigger async thread for admin + users
    threading.Thread(target=send_auction_emails, args=(item,)).start()

    # ✅ Check if item ends in less than 1 minute
    try:
        now = datetime.now(ZoneInfo("Asia/Kolkata"))
        end_str = item.get("end_date_time")
        if end_str:
            end_time = datetime.fromisoformat(end_str).astimezone(ZoneInfo("Asia/Kolkata"))
            if now <= end_time <= now + timedelta(minutes=1):
                # ✅ Notify all users except seller
                notify_auction_ending_soon(item)
    except Exception as e:
        print("⚠️ Error checking end_time for auction ending soon notification:", e)

    return jsonify({'status': 'success', 'message': 'Item posted successfully!'}), 201

@app.route('/api/debug/items', methods=['GET'])
def debug_items():
    """Debug endpoint to check all items and their status"""
    all_items = list(items_collection.find({}))
    debug_data = []
    for item in all_items:
        debug_data.append({
            'id': str(item['_id']),
            'title': item.get('title', 'No title'),
            'is_approved': item.get('is_approved', False),
            'status': item.get('status', 'No status'),
            'has_images': bool(item.get('images')),
            'image_count': len(item.get('images', []))
        })
    return jsonify({'items': debug_data, 'total': len(debug_data)}), 200

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

        # Prevent user from bidding on their own item
        if (bidder_email == item.get('contact_email')) or (bidder_id == item.get('seller_id')):
            return jsonify({'status': 'fail', 'message': 'You cannot bid on your own item.'}), 403

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
        bidder_name = user_doc.get('UserName', '') if user_doc else ''

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

        # ✅ Notify previous highest bidder
        notify_outbid_user(item_id, bidder_email)

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
        'profileImage': (profile.get('profileImage', '') if profile else '') or user.get('profileImage', '')
    }

    return jsonify({'status': 'success', 'profile': combined}), 200

@app.route('/api/update-profile', methods=['PUT'])
def update_profile():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({'status': 'fail', 'message': 'Email required'}), 400

    print(f"🔄 Updating profile for: {email}")
    print(f"📝 Profile data received: {data}")

    profile_fields = {
        "UserName": data.get("UserName", ''),
        "collegeId": data.get("collegeId", ''),
        "collegeName": data.get("collegeName", ''),
        "phone": data.get("phone", ''),
        "linkedin": data.get("linkedin", ''),
        "profileImage": data.get("profileImage", '')
    }
    print(f"🗂️ Updating profiles collection with: {profile_fields}")
    profiles_result = profiles_collection.update_one({'email': email}, {'$set': profile_fields}, upsert=True)
    print(f"✅ Profiles collection updated: {profiles_result.modified_count} documents modified")

    users_update = {
        'UserName': data.get('UserName', ''),
        'collegeId': data.get('collegeId', ''),
        'collegeName': data.get('collegeName', ''),
        'profileImage': data.get("profileImage", '')  # Also update profileImage in users collection
    }

    if data.get("password"):
        hashed = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
        users_update['password'] = hashed.decode('utf-8')

    print(f"👥 Updating users collection with: {users_update}")
    users_result = users_collection.update_one({'email': email}, {'$set': users_update})
    print(f"✅ Users collection updated: {users_result.modified_count} documents modified")

    return jsonify({'status': 'success', 'message': 'Profile updated'}), 200


@app.route('/api/items', methods=['GET'])
def get_all_items():
    search = request.args.get('search', '').strip()
    categories = request.args.getlist('category')
    pickup_methods = request.args.getlist('pickup_method')
    item_condition = request.args.getlist('item_condition')
    time_filter = request.args.get('time_filter', '').strip()  # New time filter

    query = {}
    query['is_approved'] = True

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

        # Add winner information for recently ended auctions
        if item['time_status'] == 'ended':
            winner_info = get_auction_winner(item['_id'])
            if winner_info:
                item['winner_info'] = {
                    'winner_username': winner_info['winner_username'],
                    'winning_amount': winner_info['winning_amount'],
                    'winning_timestamp': winner_info['winning_timestamp']
                }

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

        # ✨ Set default values for missing fields to avoid frontend crash
        default_fields = {
            'title': '',
            'description': '',
            'category': '',
            'tags': '',
            'images': [],
            'video': '',
            'starting_price': '',
            'minimum_increment': '',
            'buy_now_price': '',
            'start_date_time': '',
            'end_date_time': '',
            'duration': '',
            'seller_id': '',
            'location': '',
            'pickup_method': '',
            'delivery_charge': '',
            'return_policy': '',
            'terms_accepted': False,
            'report_reason': '',
            'highlights': '',
            'item_condition': '',
            'warranty': '',
            'warranty_duration': '',
            'damage_description': '',
            'limitedCollection': False,
            'timestamp': '',
            'custom_item_id': '',
            'contact_email': '',
            'is_approved': False,
            'status': 'Pending',
            'is_rejected': False,
            'approval_status': 'pending',
            'bids': [],
            'highest_bid': 0
        }

        for key, value in default_fields.items():
            if key not in item:
                item[key] = value

        # 🧹 Convert _id to string
        item['_id'] = str(item['_id'])

        # ✅ Convert nested ObjectIds (like in 'bids' field)
        if 'bids' in item and isinstance(item['bids'], list):
            for bid in item['bids']:
                if isinstance(bid, dict) and '_id' in bid:
                    bid['_id'] = str(bid['_id'])

        # 👑 Add winner info if auction has ended
        try:
            end_time = datetime.fromisoformat(item.get('end_date_time', '')).astimezone(ZoneInfo("Asia/Kolkata"))
            now = datetime.now(ZoneInfo("Asia/Kolkata"))
            if now > end_time:
                winner_info = get_auction_winner(item['_id'])
                if winner_info:
                    item['winner_info'] = {
                        'winner_username': winner_info.get('winner_username', ''),
                        'winning_amount': winner_info.get('winning_amount', 0),
                        'winning_timestamp': winner_info.get('winning_timestamp', '')
                    }
        except Exception as e:
            print(f"❌ Error checking auction status for {item['_id']}: {e}")

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

@app.route('/api/items/<item_id>', methods=['DELETE'])
def delete_item(item_id):
    try:
        print(f"🗑️ Deleting item: {item_id}")
        
        # First, check if item exists
        item = items_collection.find_one({'_id': ObjectId(item_id)})
        if not item:
            return jsonify({'status': 'fail', 'message': 'Item not found'}), 404
        
        # 1. Delete the item itself
        result = items_collection.delete_one({'_id': ObjectId(item_id)})
        
        if result.deleted_count:
            # 2. Delete all bids for this item
            bids_deleted = bids_collection.delete_many({'item_id': str(item_id)})
            print(f"🗑️ Deleted {bids_deleted.deleted_count} bids")
            
            # 3. Delete all notifications related to this item
            notifications_deleted = notifications_collection.delete_many({'item_id': str(item_id)})
            print(f"🗑️ Deleted {notifications_deleted.deleted_count} notifications")
            
            # 4. Delete all payments related to this item
            payments_deleted = db.payments.delete_many({'item_id': str(item_id)})
            print(f"🗑️ Deleted {payments_deleted.deleted_count} payments")
            
            # 5. Delete any admin comments for this item
            admin_comments_deleted = db.admin_comments.delete_many({'item_id': str(item_id)})
            print(f"🗑️ Deleted {admin_comments_deleted.deleted_count} admin comments")
            
            # 6. Delete uploaded files (images and videos)
            try:
                if item.get('images'):
                    for image_filename in item['images']:
                        image_path = os.path.join(app.config['UPLOAD_FOLDER'], image_filename)
                        if os.path.exists(image_path):
                            os.remove(image_path)
                            print(f"🗑️ Deleted image file: {image_filename}")
                
                if item.get('video'):
                    video_path = os.path.join(app.config['UPLOAD_FOLDER'], item['video'])
                    if os.path.exists(video_path):
                        os.remove(video_path)
                        print(f"🗑️ Deleted video file: {item['video']}")
            except Exception as file_error:
                print(f"⚠️ Warning: Could not delete some files: {file_error}")
            
            print(f"✅ Item and all related data deleted successfully")
            return jsonify({
                'status': 'success', 
                'message': 'Item and all related data deleted successfully',
                'deleted_counts': {
                    'item': 1,
                    'bids': bids_deleted.deleted_count,
                    'notifications': notifications_deleted.deleted_count,
                    'payments': payments_deleted.deleted_count,
                    'admin_comments': admin_comments_deleted.deleted_count
                }
            }), 200
        else:
            return jsonify({'status': 'fail', 'message': 'Item not found'}), 404
            
    except Exception as e:
        print(f"❌ Error in delete_item: {str(e)}")
        if "InvalidId" in str(e):
            return jsonify({'status': 'error', 'message': 'Invalid item ID format'}), 400
        elif "Connection" in str(e):
            return jsonify({'status': 'error', 'message': 'Database connection error'}), 500
        else:
            return jsonify({'status': 'error', 'message': f'Delete failed: {str(e)}'}), 500

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
Team AuctionVerse 💛
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
Team AuctionVerse 💛
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




def get_auction_winner(item_id):
    """Determine the winner of an auction based on highest bid"""
    try:
        # Find all bids for this item
        bids = list(bids_collection.find({'item_id': str(item_id)}))
        
        if not bids:
            return None  # No bids placed
        
        # Sort by bid amount (descending) and timestamp (ascending for tie-breaks)
        bids.sort(key=lambda b: (-float(b['bid_amount']), b['timestamp']))
        
        # Get the highest bid
        highest_bid = bids[0]
        
        # Get winner's username
        winner_username = highest_bid.get('bidder_UserName')
        if not winner_username:
            # Fallback to email prefix if username not available
            winner_email = highest_bid.get('bidder_email', '')
            winner_username = winner_email.split('@')[0] if winner_email else 'Unknown'
        
        return {
            'winner_username': winner_username,
            'winner_email': highest_bid.get('bidder_email'),
            'winning_amount': float(highest_bid['bid_amount']),
            'winning_timestamp': highest_bid.get('timestamp')
        }
    except Exception as e:
        print(f"❌ Error determining auction winner for {item_id}: {e}")
        return None

def notify_outbid_user(item_id, new_bidder_email):
    """
    Notify all users who have been outbid when a new bid is placed
    """
    item = items_collection.find_one({"_id": ObjectId(item_id)})
    if not item:
        return

    # Get all unique bidders who are not the new bidder
    outbid_emails = bids_collection.distinct(
        "bidder_email",
        {"item_id": str(item_id), "bidder_email": {"$ne": new_bidder_email}}
    )

    for outbid_email in outbid_emails:
        # Check if notification already exists to avoid duplicates
        existing = notifications_collection.find_one({
            "email": outbid_email,
            "item_id": str(item_id),
            "type": "outbid",
            "seen": False
        })

        if not existing:
            send_notification_if_allowed(
                email=outbid_email,
                message=f"⚠️ You've been outbid on '{item.get('title')}'. Bid again to win!",
                n_type="outbid",
                extra_data={
                    "item_id": str(item_id),
                    "end_time": item.get("end_time") or item.get("end_date_time"),
                    "actionable": True
                }
            )

# Run this every 60 seconds to check for expired auctions and notify
@scheduler.scheduled_job('interval', seconds=60)
def check_and_notify_expired_auctions():
    now = datetime.now(ZoneInfo("Asia/Kolkata"))
    ended_items = items_collection.find({
        'end_date_time': {'$lte': now.isoformat()},
        'notified': {'$ne': True}  # Prevent duplicate notifications
    })

    for item in ended_items:
        item_id = str(item['_id'])
        success, message = notify_auction_win_logic(item_id)
        if success:
            # Mark item as notified so it's not processed again
            items_collection.update_one({'_id': item['_id']}, {'$set': {'notified': True}})
            print(f"✅ Auction win processed for item: {item.get('title')} - {message}")
        else:
            print(f"⚠️ Skip: {item.get('title')} - {message}")

# Run this every 5 minutes to check for auctions ending soon
@scheduler.scheduled_job('interval', minutes=5)
def check_and_notify_auctions_ending_soon():
    now = datetime.now(ZoneInfo("Asia/Kolkata"))
    # Find auctions ending within the next 30 minutes
    thirty_minutes_later = now + timedelta(minutes=30)

    print(f"🔍 Checking for auctions ending between {now.isoformat()} and {thirty_minutes_later.isoformat()}")

    ending_soon_items = items_collection.find({
        'end_date_time': {
            '$gte': now.isoformat(),
            '$lte': thirty_minutes_later.isoformat()
        },
        'ending_soon_notified': {'$ne': True}  # Prevent duplicate notifications
    })

    items_list = list(ending_soon_items)
    print(f"📦 Found {len(items_list)} auctions ending soon")

    for item in items_list:
        print(f"🔔 Processing item: {item.get('title')} (Ends: {item.get('end_date_time')})")
        success = notify_auction_ending_soon_to_all_users(item)
        if success:
            # Mark item as notified so it's not processed again
            items_collection.update_one({'_id': item['_id']}, {'$set': {'ending_soon_notified': True}})
            print(f"✅ Auction ending soon notification sent for item: {item.get('title')}")
        else:
            print(f"⚠️ Failed to send auction ending soon notification for: {item.get('title')}")

    if len(items_list) == 0:
        print("📭 No auctions ending soon found")

scheduler = BackgroundScheduler()
scheduler.add_job(check_and_notify_expired_auctions, 'interval', minutes=1)
scheduler.add_job(check_and_notify_auctions_ending_soon, 'interval', minutes=5)
scheduler.start()

def notify_auction_win_logic(item_id):
    now = datetime.now(ZoneInfo("Asia/Kolkata"))
    item = items_collection.find_one({"_id": ObjectId(item_id)})

    if not item:
        return False, "Item not found"

    if item.get('notified'):
        return False, "Already notified"

    end_time_str = item.get("end_time") or item.get("end_date_time")
    if not end_time_str:
        return False, "Missing auction end time"

    try:
        end_time = datetime.fromisoformat(end_time_str).astimezone(ZoneInfo("Asia/Kolkata"))
    except Exception as e:
        return False, f"Invalid date format: {e}"

    if now <= end_time:
        return False, "Auction still ongoing"

    # ✅ Use str(item_id) to match stored string format
    highest_bid = bids_collection.find_one(
        {"item_id": str(item_id)},
        sort=[("bid_amount", -1), ("timestamp", -1)]
    )

    seller_email = item.get("contact_email", "")

    if not highest_bid:
        # No bids were placed - notify seller only
        if seller_email:
            send_notification_if_allowed(
                email=seller_email,
                message=f"📦 Your auction for '{item.get('title')}' ended with no bids.",
                n_type="auction_end",
                extra_data={"item_id": str(item_id), "actionable": False}
            )

        # Mark item as notified
        items_collection.update_one(
            {'_id': item['_id']},
            {'$set': {'notified': True}}
        )
        return True, "Auction ended with no bids - seller notified"

    bidder_email = highest_bid.get("bidder_email")
    bid_amount = float(highest_bid.get("bid_amount", 0))

    if not bidder_email:
        return False, "Winning bidder email missing"

    # Check if payment already exists
    existing_payment = payments_collection.find_one({
        "item_id": str(item_id),
        "buyer_email": bidder_email
    })

    if not existing_payment:
        # Create payment record for winner
        payments_collection.insert_one({
            "buyer_email": bidder_email,
            "seller_email": seller_email,
            "item_title": item.get("title", ""),
            "item_id": str(item_id),
            "amount": bid_amount,
            "status": "Pending",
            "timestamp": now.isoformat()
        })

    # Notify seller
    if seller_email:
        send_notification_if_allowed(
            email=seller_email,
            message=f"🎯 {bidder_email} won your item '{item.get('title')}' for ₹{bid_amount}. Payment is pending.",
            n_type="payment_pending",
            extra_data={"item_id": str(item_id), "actionable": True}
        )

    # Notify winner
    send_notification_if_allowed(
        email=bidder_email,
        message=f"🎉 Congratulations! You have won the auction for '{item.get('title')}' for ₹{bid_amount}.",
        n_type="winner",
        extra_data={"item_id": str(item_id), "actionable": True}
    )

    # ✅ Notify all outbid users that they lost
    outbid_emails = bids_collection.distinct(
        "bidder_email",
        {"item_id": str(item_id), "bidder_email": {"$ne": bidder_email}}
    )

    for outbid_email in outbid_emails:
        send_notification_if_allowed(
            email=outbid_email,
            message=f"❌ You didn't win the auction for '{item.get('title')}'. Better luck next time!",
            n_type="outbid",
            extra_data={"item_id": str(item_id), "actionable": False}
        )

    # ✅ Mark item as notified
    items_collection.update_one(
        {'_id': item['_id']},
        {'$set': {'notified': True}}
    )

    return True, "Winner, seller, and outbid users notified"

@app.route('/api/notifications/winner/<email>', methods=['GET'])
def get_winner_notifications(email):
    winner_notifs = list(notifications_collection.find({
        "email": email,
        "type": "winner"
    }).sort("timestamp", -1))

    for notif in winner_notifs:
        notif['_id'] = str(notif['_id'])
    return jsonify({"status": "success", "notifications": winner_notifs}), 200

def notify_auction_ending_soon(item):
    title = item.get("title", "Unknown item")
    item_id = str(item.get("_id"))
    end_time = item.get("end_time") or item.get("end_date_time")
    seller_email = item.get("contact_email")

    if not end_time:
        return

    users = preferences_collection.find({})
    for user in users:
        user_email = user.get("email")
        if not user_email or user_email.strip().lower() == seller_email.strip().lower():
            continue

        if user.get("enable_auction_ending", True):
            send_notification_if_allowed(
                email=user_email,
                message=f"⏳ Auction for '{title}' is ending soon. Hurry up and place your bid!",
                n_type='auction_ending',
                extra_data={'end_time': end_time, 'item_id': item_id}
            )

def notify_auction_ending_soon_to_all_users(item):
    """
    Notify all users (except the seller) when an auction is ending soon
    """
    title = item.get("title", "Unknown item")
    item_id = str(item.get("_id"))
    end_time = item.get("end_time") or item.get("end_date_time")
    seller_email = item.get("contact_email")

    if not end_time:
        print(f"❌ No end time found for item: {title}")
        return False

    try:
        # Calculate remaining time
        end_datetime = datetime.fromisoformat(end_time).astimezone(ZoneInfo("Asia/Kolkata"))
        now = datetime.now(ZoneInfo("Asia/Kolkata"))
        time_remaining = end_datetime - now

        if time_remaining.total_seconds() <= 0:
            print(f"❌ Auction already ended for item: {title}")
            return False

        # Format remaining time
        hours = int(time_remaining.total_seconds() // 3600)
        minutes = int((time_remaining.total_seconds() % 3600) // 60)

        if hours > 0:
            time_text = f"{hours}h {minutes}m"
        else:
            time_text = f"{minutes}m"

        # Get all users from the users collection
        all_users = users_collection.find({})
        all_users_list = list(all_users)
        print(f"👥 Found {len(all_users_list)} total users in database")
        notified_count = 0

        for user in all_users_list:
            user_email = user.get("email")
            print(f"🔍 Processing user: {user_email}")

            # Skip if no email or if it's the seller
            if not user_email:
                print(f"  ❌ Skipping user with no email")
                continue

            if not seller_email:
                # Optionally log or skip, but don't call .strip() on None
                continue
            if user_email.strip().lower() == seller_email.strip().lower():
                print(f"  ❌ Skipping seller: {user_email}")
                continue

            # Check user preferences
            prefs = preferences_collection.find_one({'email': user_email})
            if prefs and prefs.get('enable_auction_ending', True) is False:
                print(f"  ❌ User has disabled auction ending notifications: {user_email}")
                continue  # User has disabled auction ending notifications

            # Check if notification already exists to avoid duplicates
            existing_notif = notifications_collection.find_one({
                'email': user_email,
                'item_id': item_id,
                'type': 'auction_ending',
                'timestamp': {
                    '$gte': (now - timedelta(minutes=10)).isoformat()  # Within last 10 minutes
                }
            })

            if existing_notif:
                print(f"  ❌ Already notified recently: {user_email}")
                continue  # Already notified recently

            # Send notification
            print(f"  ✅ Sending notification to: {user_email}")
            success = send_notification_if_allowed(
                email=user_email,
                message=f"⏰ Auction for '{title}' is ending in {time_text}! Don't miss your chance to bid!",
                n_type='auction_ending',
                extra_data={
                    'end_time': end_time,
                    'item_id': item_id,
                    'seller_email': seller_email,
                    'actionable': True
                }
            )

            if success:
                notified_count += 1
                print(f"  ✅ Notification sent successfully to: {user_email}")
            else:
                print(f"  ❌ Failed to send notification to: {user_email}")

        print(f"✅ Sent auction ending soon notifications to {notified_count} users for item: {title}")
        return True

    except Exception as e:
        print(f"❌ Error notifying users about auction ending soon for {title}: {e}")
        return False

@app.route('/api/notify-auctions-ending-soon', methods=['POST'])
def notify_all_ended_auctions():
    now = datetime.now(ZoneInfo("Asia/Kolkata"))
    ended_items = items_collection.find({
        'end_date_time': {'$lte': now.isoformat()}
    })

    notified = 0
    for item in ended_items:
        item_id = str(item['_id'])
        success, _ = notify_auction_win_logic(item_id)
        if success:
            notified += 1

    return f"✅ {notified} ended auctions processed"

@app.route('/api/notify-auctions-ending-soon-manual', methods=['POST'])
def manually_notify_auctions_ending_soon():
    """
    Manual endpoint to trigger auction ending soon notifications
    Useful for testing and immediate notifications
    """
    try:
        now = datetime.now(ZoneInfo("Asia/Kolkata"))
        # Find auctions ending within the next 30 minutes
        thirty_minutes_later = now + timedelta(minutes=30)

        ending_soon_items = items_collection.find({
            'end_date_time': {
                '$gte': now.isoformat(),
                '$lte': thirty_minutes_later.isoformat()
            }
        })

        notified_items = []
        for item in ending_soon_items:
            success = notify_auction_ending_soon_to_all_users(item)
            if success:
                notified_items.append(item.get('title', 'Unknown'))

        return jsonify({
            'status': 'success',
            'message': f'Processed {len(notified_items)} auctions ending soon',
            'items': notified_items
        }), 200

    except Exception as e:
        print(f"❌ Error in manual auction ending notification: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/debug/auction-status', methods=['GET'])
def debug_auction_status():
    """
    Debug endpoint to check current auction and user status
    """
    try:
        now = datetime.now(ZoneInfo("Asia/Kolkata"))
        thirty_minutes_later = now + timedelta(minutes=30)

        # Get all auctions
        all_auctions = list(items_collection.find({}))

        # Get auctions ending soon
        ending_soon_auctions = list(items_collection.find({
            'end_date_time': {
                '$gte': now.isoformat(),
                '$lte': thirty_minutes_later.isoformat()
            }
        }))

        # Get all users
        all_users = list(users_collection.find({}))

        # Get user count with emails
        users_with_emails = [u for u in all_users if u.get('email')]

        return jsonify({
            'status': 'success',
            'current_time': now.isoformat(),
            'thirty_minutes_later': thirty_minutes_later.isoformat(),
            'total_auctions': len(all_auctions),
            'auctions_ending_soon': len(ending_soon_auctions),
            'total_users': len(all_users),
            'users_with_emails': len(users_with_emails),
            'ending_soon_auctions': [
                {
                    'title': auction.get('title'),
                    'end_date_time': auction.get('end_date_time'),
                    'ending_soon_notified': auction.get('ending_soon_notified', False),
                    'seller_email': auction.get('contact_email')
                }
                for auction in ending_soon_auctions
            ],
            'sample_users': [
                {
                    'email': user.get('email'),
                    'has_preferences': bool(preferences_collection.find_one({'email': user.get('email')}))
                }
                for user in users_with_emails[:5]  # Show first 5 users
            ]
        }), 200

    except Exception as e:
        print(f"❌ Error in debug auction status: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/notifications/outbid/<email>', methods=['GET'])
def get_outbid_notifications(email):
    try:
        outbid_notifications = list(
            notifications_collection.find({
                'email': email,
                'type': 'outbid'
            }).sort('timestamp', -1)
        )

        for notif in outbid_notifications:
            notif['_id'] = str(notif['_id'])

        return jsonify({'status': 'success', 'notifications': outbid_notifications}), 200

    except Exception as e:
        print("❌ Error fetching outbid notifications:", e)
        return jsonify({'status': 'error', 'message': str(e)}), 500

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
# Get user preferences
# ======================
@app.route('/api/notifications/preferences/<email>', methods=['GET'])
@jwt_required()
def get_notification_preferences(email):
    DEFAULT_PREFS = {
        'enable_outbid': True,
        'enable_auction_ending': True,
        'enable_winner': True,
        'enable_new_item': True,
        'enable_payment': True,
        'enable_admin_comment': True,
        'enable_auction_end': True
    }
    prefs = preferences_collection.find_one({'email': email})
    if not prefs:
        prefs = DEFAULT_PREFS.copy()
        preferences_collection.insert_one({"email": email, **prefs})
    else:
        # Ensure all keys are present
        for key, value in DEFAULT_PREFS.items():
            if key not in prefs:
                prefs[key] = value
        # Optionally update DB with missing keys
        preferences_collection.update_one({'email': email}, {'$set': prefs})
    prefs.pop('_id', None)
    return jsonify({'status': 'success', 'preferences': prefs})

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
# Add new notification manually
# ======================
@app.route('/api/notifications/add', methods=['POST'])
def add_notification():
    data = request.get_json()
    email = data.get('email')
    message = data.get('message')
    n_type = data.get('type', 'general').lower()

    if not email or not message:
        return jsonify({'status': 'fail', 'message': 'Missing email or message'}), 400

    prefs = preferences_collection.find_one({'email': email})
    if prefs and not prefs.get(f'enable_{n_type}', True):
        return jsonify({'status': 'skipped', 'message': f'{n_type} notifications disabled by user'}), 200

    notif_data = {
        'email': email,
        'message': message,
        'type': n_type,
        'seen': False,
        'timestamp': datetime.now(ZoneInfo("Asia/Kolkata")).isoformat()
    }

    # Attach end_time if provided (for auction_ending)
    if n_type == 'auction_ending' and 'end_time' in data:
        notif_data['end_time'] = data['end_time']

    notifications_collection.insert_one(notif_data)

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
# Send notification if allowed
# ======================
def send_notification_if_allowed(email, message, n_type='general', extra_data=None):
    try:
        n_type = n_type.lower()
        prefs = preferences_collection.find_one({'email': email}) or {}

        if prefs.get(f'enable_{n_type}', True) is False:
            print(f"❌ Notification '{n_type}' skipped for {email} (disabled in prefs)")
            return False

        notif_data = {
            'email': email,
            'message': message,
            'type': n_type,
            'seen': False,
            'timestamp': datetime.now(ZoneInfo("Asia/Kolkata")).isoformat()
        }

        if extra_data:
            notif_data.update(extra_data)

        print("👉 Inserting into notifications_collection:", notif_data)

        result = notifications_collection.insert_one(notif_data)
        print(f"✅ Notification of type '{n_type}' sent to {email}. ID: {result.inserted_id}")
        return True

    except Exception as e:
        print(f"❌ Error sending notification to {email}: {e}")
        return False

@app.route('/api/admin/items', methods=['GET'])
def get_all_items_for_admin():
    items = list(items_collection.find({}))
    for item in items:
        item['_id'] = str(item['_id'])  # Make ObjectId serializable
    return jsonify(items)

# ✅ Keep this one only!
@app.route('/api/items/approve/<item_id>', methods=['PUT'])
def approve_reject_item(item_id):
    try:
        is_approved = request.args.get('is_approved', '').lower() == 'true'
        is_rejected = request.args.get('is_rejected', '').lower() == 'true'

        if is_approved and not is_rejected:
            status = 'Approved'
        elif is_rejected and not is_approved:
            status = 'Rejected'
        else:
            return jsonify({'message': 'Invalid approval/rejection combination'}), 400

        update_fields = {
            "is_approved": is_approved,
            "is_rejected": is_rejected,
            "status": status
        }

        result = items_collection.update_one(
            {"_id": ObjectId(item_id)},
            {"$set": update_fields}
        )

        if result.matched_count == 0:
            return jsonify({'message': 'Item not found'}), 404

        item = items_collection.find_one({"_id": ObjectId(item_id)})
        seller_email = item.get("seller_id")
        item_title = item.get("title")
        item_title = item.get("title")
        item_category = item.get("category", "N/A")
        starting_price = item.get("starting_price", "N/A")
        end_time = item.get("end_time", "N/A")

        print(f"📧 Sending email to: {seller_email}")

        if not seller_email or '@' not in seller_email:
            print("❌ Invalid seller email. Email not sent.")
            return jsonify({'message': 'Item updated, but email not sent'}), 200

        subject = f"📝 Your item has been {status}"
        if is_approved:
            body = f"""
Hello {seller_email},

🎉 Good news! Your item titled "{item_title}" has been APPROVED by the admin ✅

It is now LIVE on AuctionVerse and visible to all users for bidding! 🛍️

Thank you for using AuctionVerse 🌟

Team AuctionVerse 💛
""".strip()
        else:
            body = f"""
Hello {seller_email},

We regret to inform you that your item titled "{item_title}" has been REJECTED ❌ by the admin.

This could be due to incomplete details or a policy violation.

You can edit and resubmit the item for reapproval.

Thank you for understanding  
Team AuctionVerse 💛
""".strip()

        try:
            msg = Message(subject=subject, recipients=[seller_email], body=body)
            mail.send(msg)
            print(f"✅ Email sent to {seller_email} about {status}")
        except Exception as e:
            print(f"❌ Email failed: {e}")

        # ✅ Send email to all users if approved
        if is_approved:
            admin_email = "admin@auctionverse.com"  # Replace with actual admin email if stored
            user_emails = [
                user['email'] for user in db.users.find({}, {"email": 1})
                if "@" in user.get("email", "")
                and user['email'] != seller_email
                and user['email'] != admin_email
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
Team AuctionVerse 💛
""".strip()

            for email in user_emails:
                try:
                    msg = Message(subject=subject_all, recipients=[email], body=body_all)
                    mail.send(msg)
                    print(f"📧 Auction alert sent to {email}")
                except Exception as e:
                    print(f"❌ Failed to send to {email}: {e}")

        return jsonify({'message': f'Item {status.lower()} successfully'}), 200

    except Exception as e:
        print("❌ Error during approval/rejection:", e)
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
    password = user.get('password') if user else None
    if not user or not password or not isinstance(password, str):
        return jsonify({'status': 'fail', 'message': 'User not found or password missing'}), 404

    # Ensure password is a string
    password_str = str(password)
    if bcrypt.checkpw(new_password.encode('utf-8'), password_str.encode('utf-8')):
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

# ------------------ ✅ Payment ROUTE ------------------
@app.route('/api/payments/<buyer_email>', methods=['GET'])
def get_user_payment(buyer_email):
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
    
@app.route('/api/create-order', methods=['POST'])
def create_order():
    data = request.get_json()
    amount = data.get('amount')
    email = data.get('email')
    item_id = data.get('itemId')

    # Basic validation
    if not amount or not email or not item_id:
        return jsonify({'status': 'fail', 'message': 'Amount, email, and itemId are required'}), 400

    try:
        amount_paise = int(amount) * 100

        order = razorpay_client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "payment_capture": 1
        })

        return jsonify({
            'status': 'success',
            'order_id': order['id'],
            'amount': amount_paise,
            'currency': 'INR',
            'razorpay_key': RAZORPAY_KEY_ID
        }), 200

    except Exception as e:
        return jsonify({'status': 'fail', 'message': f"Error creating order: {str(e)}"}), 500


@app.route('/api/payments/<email>', methods=['GET'])
def get_user_payments(email):
    try:
        if not email:
            return jsonify({"status": "fail", "message": "Email is required"}), 400

        user_payments = list(db.payments.find({"email": email}))
        for payment in user_payments:
            payment['_id'] = str(payment['_id'])  # Convert ObjectId to string

        return jsonify({"status": "success", "payments": user_payments}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"}), 500

@app.route('/api/verify-payment', methods=['POST'])
def verify_payment():
    data = request.get_json()
    order_id = data.get('razorpay_order_id')
    payment_id = data.get('razorpay_payment_id')
    signature = data.get('razorpay_signature')
    email = data.get('email')
    item_id = data.get('itemId')
    amount = data.get('amount')

    # Step 1: Verify Razorpay signature
    generated_signature = hmac.new(
        bytes(RAZORPAY_KEY_SECRET, 'utf-8'),
        msg=bytes(order_id + "|" + payment_id, 'utf-8'),
        digestmod=hashlib.sha256
    ).hexdigest()

    if generated_signature != signature:
        return jsonify({'status': 'fail', 'message': 'Payment signature verification failed'}), 400

    # Step 2: Get item info
    item = db.items.find_one({"_id": ObjectId(item_id)})
    item_title = item.get('title', 'Unknown') if item else 'Unknown'
    seller_email = item.get('posted_by', 'Unknown') if item else 'Unknown'

    # Step 3: Try to update existing pending payment
    updated = db.payments.update_one(
        {
            "item_id": item_id,
            "email": email,
            "status": "Pending"
        },
        {
            "$set": {
                "status": "Paid",
                "razorpay_order_id": order_id,
                "razorpay_payment_id": payment_id,
                "confirmed_at": datetime.now(ZoneInfo("Asia/Kolkata")).isoformat()
            }
        }
    )

    if updated.modified_count == 0:
        # No existing pending record, so insert new
        payment_data = {
            'email': email,
            'item_id': item_id,
            'amount': amount,
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'item_title': item_title,
            'seller_email': seller_email,
            'status': 'Paid',
            'confirmed_at': datetime.now(ZoneInfo("Asia/Kolkata")).isoformat()
        }
        db.payments.insert_one(payment_data)

    return jsonify({'status': 'success', 'message': 'Payment verified and updated'}), 200

# ------------------ ✅ PROTECTED ROUTE ------------------
@app.route('/api/protected/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    user_email = get_jwt_identity()
    return jsonify({'message': f'Welcome {user_email}, this is a protected route!'}), 200
    
# ------------------ Delete Account Endpoint ------------------

@app.route('/api/delete-account', methods=['DELETE'])
@jwt_required()
def delete_account():
    email = get_jwt_identity()
    if not email:
        return jsonify({'status': 'fail', 'message': 'User not authenticated'}), 401

    # Remove user from all relevant collections
    users_collection.delete_one({'email': email})
    profiles_collection.delete_one({'email': email})
    bids_collection.delete_many({'bidder_email': email})
    items_collection.delete_many({'seller_id': email})
    notifications_collection.delete_many({'email': email})
    db.payments.delete_many({'buyer_email': email})
    db.payments.delete_many({'seller_email': email})
    reset_tokens_collection.delete_many({'email': email})

    return jsonify({'status': 'success', 'message': 'Account and all related data deleted.'}), 200

# User Recent Activities Routes
@app.route('/api/user-activities/<email>', methods=['GET'])
def get_user_activities(email):
    """Get all activities for a specific user"""
    try:
        activities = user_activities.get(email, [])
        return jsonify({
            'status': 'success',
            'activities': activities
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/log-activity', methods=['POST'])
def log_activity():
    """Log a new user activity"""
    try:
        data = request.get_json()
        email = data.get('email')
        activity_type = data.get('type')
        action = data.get('action')
        item = data.get('item', '')
        amount = data.get('amount', 0)
        category = data.get('category', 'Other')
        status = data.get('status', 'completed')
        
        if not email or not activity_type or not action:
            return jsonify({
                'status': 'error',
                'message': 'Missing required fields'
            }), 400
        
        activity = {
            'id': f"{email}_{datetime.now().timestamp()}",
            'type': activity_type,
            'action': action,
            'item': item,
            'amount': amount,
            'category': category,
            'status': status,
            'timestamp': datetime.now().isoformat(),
            'email': email
        }
        
        if email not in user_activities:
            user_activities[email] = []
        
        user_activities[email].append(activity)
        
        # Keep only last 100 activities per user
        if len(user_activities[email]) > 100:
            user_activities[email] = user_activities[email][-100:]
        
        return jsonify({
            'status': 'success',
            'message': 'Activity logged successfully',
            'activity': activity
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/clear-activities/<email>', methods=['DELETE'])
def clear_user_activities(email):
    """Clear all activities for a user"""
    try:
        if email in user_activities:
            user_activities[email] = []
        
        return jsonify({
            'status': 'success',
            'message': 'Activities cleared successfully'
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/activity-stats/<email>', methods=['GET'])
def get_activity_stats(email):
    """Get activity statistics for a user"""
    try:
        activities = user_activities.get(email, [])
        
        stats = {
            'total_activities': len(activities),
            'by_type': {},
            'by_category': {},
            'by_status': {},
            'recent_activity': None
        }
        
        for activity in activities:
            # Count by type
            activity_type = activity.get('type', 'unknown')
            stats['by_type'][activity_type] = stats['by_type'].get(activity_type, 0) + 1
            
            # Count by category
            category = activity.get('category', 'Other')
            stats['by_category'][category] = stats['by_category'].get(category, 0) + 1
            
            # Count by status
            status = activity.get('status', 'unknown')
            stats['by_status'][status] = stats['by_status'].get(status, 0) + 1
        
        # Get most recent activity
        if activities:
            stats['recent_activity'] = max(activities, key=lambda x: x.get('timestamp', ''))
        
        return jsonify({
            'status': 'success',
            'stats': stats
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/populate-activities/<email>', methods=['POST'])
def populate_existing_activities(email):
    """Populate activities from existing user data (posts, bids, etc.)"""
    try:
        # Check if user exists
        user = users_collection.find_one({'email': email})
        if not user:
            return jsonify({
                'status': 'error',
                'message': 'User not found'
            }), 404

        # Initialize user activities if not exists
        if email not in user_activities:
            user_activities[email] = []

        activities_added = 0

        # 1. Get all posts by this user
        user_posts = items_collection.find({'seller_id': email})
        for post in user_posts:
            activity = {
                'id': f"{email}_post_{post['_id']}",
                'type': 'post',
                'action': 'posted item',
                'item': post.get('title', 'Untitled Item'),
                'amount': int(post.get('starting_price', 0)),
                'category': post.get('category', 'Other'),
                'status': post.get('status', 'active'),
                'timestamp': post.get('timestamp', post.get('created_at', datetime.now().isoformat())),
                'email': email
            }
            
            # Check if activity already exists
            if not any(a['id'] == activity['id'] for a in user_activities[email]):
                user_activities[email].append(activity)
                activities_added += 1

        # 2. Get all bids by this user
        user_bids = bids_collection.find({'bidder_email': email})
        for bid in user_bids:
            # Get the item details for the bid
            item = items_collection.find_one({'_id': ObjectId(bid.get('item_id'))})
            if item:
                activity = {
                    'id': f"{email}_bid_{bid['_id']}",
                    'type': 'bid',
                    'action': 'placed bid',
                    'item': item.get('title', 'Unknown Item'),
                    'amount': int(bid.get('bid_amount', 0)),
                    'category': item.get('category', 'Other'),
                    'status': bid.get('auction_result', 'active'),
                    'timestamp': bid.get('timestamp', datetime.now().isoformat()),
                    'email': email
                }
                
                # Check if activity already exists
                if not any(a['id'] == activity['id'] for a in user_activities[email]):
                    user_activities[email].append(activity)
                    activities_added += 1

        # 3. Get profile activities
        profile = profiles_collection.find_one({'email': email})
        if profile:
            # Profile creation/update activity
            if profile.get('createdAt') or profile.get('timestamp'):
                activity = {
                    'id': f"{email}_profile_creation",
                    'type': 'profile',
                    'action': 'updated profile',
                    'item': 'Profile Information',
                    'amount': 0,
                    'category': 'Profile',
                    'status': 'completed',
                    'timestamp': profile.get('createdAt', profile.get('timestamp', datetime.now().isoformat())),
                    'email': email
                }
                
                if not any(a['id'] == activity['id'] for a in user_activities[email]):
                    user_activities[email].append(activity)
                    activities_added += 1

            # Profile image activity
            if profile.get('profileImage'):
                activity = {
                    'id': f"{email}_profile_image",
                    'type': 'profile',
                    'action': 'added profile picture',
                    'item': 'Profile Image',
                    'amount': 0,
                    'category': 'Profile',
                    'status': 'completed',
                    'timestamp': profile.get('createdAt', profile.get('timestamp', datetime.now().isoformat())),
                    'email': email
                }
                
                if not any(a['id'] == activity['id'] for a in user_activities[email]):
                    user_activities[email].append(activity)
                    activities_added += 1

        # 4. Get payment activities
        payments = db.payments.find({'buyer_email': email})
        for payment in payments:
            activity = {
                'id': f"{email}_payment_{payment['_id']}",
                'type': 'payment',
                'action': 'completed payment' if payment.get('status') == 'Completed' else 'pending payment',
                'item': payment.get('item_title', 'Auction Item'),
                'amount': int(payment.get('amount', 0)),
                'category': 'Payment',
                'status': payment.get('status', 'pending'),
                'timestamp': payment.get('timestamp', datetime.now().isoformat()),
                'email': email
            }
            
            if not any(a['id'] == activity['id'] for a in user_activities[email]):
                user_activities[email].append(activity)
                activities_added += 1

        # Sort activities by timestamp (newest first)
        user_activities[email].sort(key=lambda x: x.get('timestamp', ''), reverse=True)

        # Keep only last 100 activities
        if len(user_activities[email]) > 100:
            user_activities[email] = user_activities[email][:100]

        return jsonify({
            'status': 'success',
            'message': f'Successfully populated {activities_added} activities from existing data',
            'total_activities': len(user_activities[email]),
            'activities_added': activities_added
        })

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/')
def home():
    return "✅ Flask backend with MongoDB, JWT Auth, and Auction APIs is live!"


app.config["DB"] = db  # ✅ Important to set this before registering blueprint
app.config["USERS_COLLECTION"] = users_collection
app.register_blueprint(listings_bp, url_prefix="/api")
app.register_blueprint(auth_bp, url_prefix='/api/auth')

if __name__ == '__main__':
    app.run(debug=True, use_reloader=True, extra_files=[], reloader_type='watchdog')

