
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

# MongoDB setup
client = MongoClient(os.getenv('MONGO_URI'))
db = client['auctiondb']

# ---------- User Routes ----------

@app.route('/api/users/register', methods=['POST'])
def register_user():
    data = request.get_json()
    hashed_pw = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    user = {
        'username': data['username'],
        'email': data['email'],
        'password': hashed_pw
    }
    db.users.insert_one(user)
    user['_id'] = str(user['_id'])  # Convert ObjectId to string
    return jsonify({'message': 'User registered successfully', 'user': user}), 201

# ---------- Item Routes ----------

@app.route('/api/items/create', methods=['POST'])
def create_item():
    data = request.get_json()
    
    item = {
        'title': data['title'],
        'description': data['description'],
        'startingPrice': data['startingPrice'],
        'imageUrl': data['imageUrl'],
        'currentBid': 0,
        'endTime': datetime.strptime(data['endTime'], '%Y-%m-%dT%H:%M:%S'),
        'sellerId': data['sellerId']
    }
    db.items.insert_one(item)
    item['_id'] = str(item['_id'])
    return jsonify({'message': 'Item created successfully', 'item': item}), 201

@app.route('/api/items', methods=['GET'])
def get_items():
    items = []
    for item in db.items.find():
        item['_id'] = str(item['_id'])
        items.append(item)
    return jsonify(items), 200

# ---------- Bid Routes ----------

@app.route('/api/bids/place', methods=['POST'])
def place_bid():
    data = request.get_json()
    
    item = db.items.find_one({'_id': ObjectId(data['itemId'])})
    if not item:
        return jsonify({'error': 'Item not found'}), 404

    if float(data['bidAmount']) <= float(item.get('currentBid', 0)):
        return jsonify({'error': 'Bid must be higher than current bid'}), 400

    bid = {
        'itemId': data['itemId'],
        'bidderId': data['bidderId'],
        'bidAmount': float(data['bidAmount']),
        'bidTime': datetime.now()
    }
    db.bids.insert_one(bid)

    db.items.update_one(
        {'_id': ObjectId(data['itemId'])},
        {'$set': {'currentBid': float(data['bidAmount'])}}
    )

    bid['_id'] = str(bid['_id'])
    return jsonify({'message': 'Bid placed successfully', 'bid': bid}), 201

# ---------- Run the Flask App ----------

if __name__ == '__main__':
    app.run(debug=True)
