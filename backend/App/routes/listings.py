from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from bson import ObjectId
import datetime

listings_bp = Blueprint('listings_bp', __name__)

# --------------------------
# POST - Add a new item
# --------------------------



# --------------------------
# GET - Get all items (optional filters)
# --------------------------
@listings_bp.route('/items', methods=['GET'])
def get_all_items():
    db = current_app.config["DB"]

    category = request.args.get('category')
    user_email = request.args.get('userEmail')

    query = {}
    if category:
        query['category'] = category
    if user_email:
        query['userEmail'] = user_email

    items = list(db["items"].find(query))

    for item in items:
        item['_id'] = str(item['_id'])
        item['thumbnail'] = item['images'][0] if item.get('images') else ''
        item['bids'] = item.get('bids', [])

    return jsonify({'status': 'success', 'items': items}), 200


# --------------------------
# GET - Get item by ID
# --------------------------
@listings_bp.route('/item/<item_id>', methods=['GET'])
def get_single_item(item_id):
    db = current_app.config["DB"]
    try:
        item = db["items"].find_one({'_id': ObjectId(item_id)})
        if not item:
            return jsonify({'status': 'fail', 'message': 'Item not found'}), 404

        item['_id'] = str(item['_id'])
        return jsonify({'status': 'success', 'item': item}), 200

    except Exception:
        return jsonify({'status': 'fail', 'message': 'Invalid item ID'}), 400


# --------------------------
# GET - Get items by user email
# --------------------------
@listings_bp.route('/items/user/<email>', methods=['GET'])
def get_items_by_user(email):
    db = current_app.config["DB"]
    items = list(db["items"].find({'userEmail': email}))

    for item in items:
        item['_id'] = str(item['_id'])
        item['thumbnail'] = item['images'][0] if item.get('images') else ''
        item['bids'] = item.get('bids', [])

    return jsonify({'status': 'success', 'items': items}), 200


# --------------------------
# PUT - Update item by ID
# --------------------------
@listings_bp.route('/item/<item_id>', methods=['PUT'])
@jwt_required()
def update_item(item_id):
    db = current_app.config["DB"]
    data = request.get_json()

    update_data = {k: v for k, v in data.items() if k not in ['_id', 'userEmail']}
    result = db["items"].update_one({'_id': ObjectId(item_id)}, {'$set': update_data})

    if result.modified_count:
        return jsonify({'status': 'success', 'message': 'Item updated'}), 200
    return jsonify({'status': 'fail', 'message': 'Item not found or unchanged'}), 404


# --------------------------
# DELETE - Delete item
# --------------------------
@listings_bp.route('/item/<item_id>', methods=['DELETE'])
@jwt_required()
def delete_item(item_id):
    db = current_app.config["DB"]
    result = db["items"].delete_one({'_id': ObjectId(item_id)})

    if result.deleted_count:
        return jsonify({'status': 'success', 'message': 'Item deleted'}), 200
    return jsonify({'status': 'fail', 'message': 'Item not found'}), 404


# --------------------------
# POST - Place a bid on an item
# --------------------------
@listings_bp.route('/item/<item_id>/bid', methods=['POST'])
@jwt_required()
def place_bid(item_id):
    db = current_app.config["DB"]
    data = request.get_json()

    bid_amount = data.get('bidAmount')
    bidder_email = data.get('bidderEmail')
    bidder_name = data.get('bidderName')

    if not bid_amount or not bidder_email or not bidder_name:
        return jsonify({'status': 'fail', 'message': 'Missing bid details'}), 400

    item = db["items"].find_one({'_id': ObjectId(item_id)})
    if not item:
        return jsonify({'status': 'fail', 'message': 'Item not found'}), 404

    bid = {
        'bidAmount': float(bid_amount),
        'bidderEmail': bidder_email,
        'bidderName': bidder_name,
        'timestamp': datetime.datetime.now().isoformat()
    }

    db["items"].update_one({'_id': ObjectId(item_id)}, {'$push': {'bids': bid}})

    return jsonify({'status': 'success', 'message': 'Bid placed successfully'}), 200
