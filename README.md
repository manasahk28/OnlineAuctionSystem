# Online Auction System

Welcome to the **Online Auction System**, a full-stack web app for managing campus-based product auctions.  
Users can register, log in, list items for auction, and place bids in real-time!

---

## ✨ Features

- 🔐 Secure User Authentication  
- 📦 Post items for auction with full details (images, tags, categories)  
- 🕒 Bidding system with auction timers  
- 🧾 Admin approval, mini statements, and reporting  
- 📊 MongoDB database for all backend data  
- 💻 Built with Flask + ReactJS

---

## Tech Stack
### Backend
- Python 3.10+  
- Flask  
- Flask-CORS  
- PyMongo  
- MongoDB Atlas

### Frontend
- React.js  
- HTML, CSS, JavaScript  
- Fetch

---

## MongoDB Setup
Using **MongoDB Atlas** with **PyMongo** to store all user/item/bid data.

### Steps:
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create an account.
2. Create a **Cluster** and a **Database** (e.g., `auctionDB`)
3. Add collections such as `users`, `items`, `bids`
4. Get your **connection string**:
mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
5. Paste the string in your `app.py`:
```python
from pymongo import MongoClient

MONGO_URI = "mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority"
client = MongoClient(MONGO_URI)
db = client["auctionDB"]
users_collection = db["users"]
items_collection = db["items"]
```

---

## Running the App
### 1. Backend Setup (Flask + MongoDB)
```text
cd backend  # Navigate to backend folder

# Install required packages
pip install flask flask-cors pymongo
pip install tzdata
pip install Flask-mail
pip install python-dotenv
pip install pymongo dnspythn flask-cors 

python app.py  # Start the Flask server

```
The backend runs at: http://localhost:5000/

### 2. Frontend Setup (React)
```text
cd frontend  # Navigate to frontend folder

npm install  # Install React dependencies

npm start  # Start the React app

```
The frontend runs at: http://localhost:3000/

---

## Folder Structure

```text
Online-Auction-System/
├── backend/
│   ├── app.py
│   ├── database.py (optional)
│   └── routes/
│       ├── auth.py
│       └── auctions.py
├── frontend/
│   ├── src/
│   │   ├── pages
│   │   └── App.js
│   └── package.json
├── README.md
```

---

## Notes
- Whitelist your IP in MongoDB Atlas for database access.
- Store your Mongo URI in an .env file instead of hardcoding it.
- Payment handling is dummy-only — no real transactions used.

---

## Future Enhancements
- Razorpay/Stripe integration for real payments
- Real-time bidding using WebSockets
- Admin dashboard with reports and analytics

---

### 👩‍💻 Made with 💙 for Students by Students
Crafted with curiosity and code as part of an academic internship project — to empower student sales with a fun, digital touch! 🚀🎓
