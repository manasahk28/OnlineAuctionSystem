# 🌌 AuctionVerse — Campus Online Auction System

Welcome to **AuctionVerse**, a state-of-the-art, full-stack campus-based product auction platform. Designed to facilitate and secure campus-wide trading, AuctionVerse allows students to list items, participate in real-time bidding, analyze item valuations, and chat with an intelligent virtual auction assistant!

---

## ✨ Features

### 🔐 1. Secure Authentication & Profile Settings
*   **JWT Token Authorization**: Complete security for listing creations, editing, deleting, and bidding.
*   **Bcrypt Password Hashing**: Hashed passwords stored securely in MongoDB database.
*   **Password Security**: High-entropy password requirements (uppercase, lowercase, number, special character, 8+ characters).
*   **Custom Profiles**: Personalized avatars, bio links, contact information, and account settings.

### 📦 2. Interactive Listing & Auction Creation
*   **Rich Listing Customization**: Upload up to 3 images, optional video media, categories, custom tags, location, and warranty details.
*   **Bidding Constraints**: Minimum increments, custom starting prices, and instantaneous bid verification.
*   **Smart ID Generation**: Standardized custom Item IDs like `AUC-ELEC-002` based on categories and sequence count.

### 🤖 3. Intelligent Virtual Assistant (Noa)
*   **Groq API Integration**: Built-in chatbot powered by the advanced `llama-3.3-70b-versatile` LLM model.
*   **Context-Aware Dialogues**: Answers standard platform FAQs, dynamically searches live items currently listed on the auction board, and pulls personalized contextual info (user bids status, user's active listings) directly from MongoDB.

### 📈 4. Dashboards & Analytics
*   **Admin Dashboard**: Approve or reject submitted listings, analyze pending auctions, and manage platform safety.
*   **User Dashboard**: Comprehensive overview of bids won/active, personal listings status (Live/Pending/Ended/Rejected), and recent user activity history.
*   **Data Visualization**: Integrated charts utilizing **Recharts** to plot student auction statistics and activity patterns.

### 🌓 5. Dynamic Dual-Theme Mode
*   **Context-Based Themes**: Seamlessly toggle between Light and Dark mode across all pages via custom React context (`ThemeContext`).

### 🔔 6. Automated Mail & In-App Alerts
*   **Outbid Notifications**: Instant UI notifications and status updates if outbid by another student.
*   **APScheduler Background Timers**: Automatically monitors auction lifecycles.
*   **Flask-Mail System**: Sends email notifications to sellers, administrators, and winners on auction completions or review submissions.

### 🏷️ 7. Price Estimation Engine
*   **Frontend Damage Tool**: Quickly estimates item devaluation based on damage parameters.
*   **Machine Learning Model**: Includes offline Linear Regression training scripts (`train_price_model.py`) that exports `price_estimator.pkl` and `encoders.pkl` using category, condition, tags, duration, and damage data.

---

## 🛠️ Tech Stack

### Backend
*   **Language**: Python 3.10+
*   **Core Framework**: Flask
*   **Database Access**: PyMongo (MongoDB Atlas)
*   **Authentication**: Flask-JWT-Extended & Bcrypt
*   **AI Engine**: Groq API (`llama-3.3-70b-versatile`)
*   **Background Jobs**: APScheduler
*   **Mail Engine**: Flask-Mail (SMTP client)
*   **Payments**: Razorpay SDK
*   **Environment**: python-dotenv, watchdog

### Frontend
*   **Language**: JavaScript / HTML5 / Custom Vanilla CSS
*   **Core Library**: React 19 (React-scripts)
*   **Routing**: React Router DOM v7
*   **Charts**: Recharts
*   **Icons**: React Icons, FontAwesome Icons
*   **API Client**: Axios

---

## 📂 Project Directory Structure

```text
OnlineAuctionSystem/
├── backend/
│   ├── app.py                     # Main Flask entrypoint & APIs
│   ├── train_price_model.py       # Offline price estimation trainer
│   ├── price_estimator.pkl        # Trained ML model checkpoint
│   ├── encoders.pkl               # ML categorical feature encoders
│   ├── requirements.txt           # Python backend dependencies
│   ├── .env                       # Backend local configuration
│   └── App/
│       ├── __init__.py
│       ├── routes/
│       │   ├── auth.py            # Authentication blueprints
│       │   ├── listings.py        # Auction creation & retrieval blueprints
│       │   └── protected_routes.py# Secured path validations
│       └── utils/
│           ├── email_sender.py    # Flask-Mail dispatchers
│           └── jwt_token.py       # Token generator helpers
│
└── frontend/
    ├── package.json               # Node packages and start scripts
    ├── .env                       # Frontend local configuration
    ├── public/
    └── src/
        ├── index.js               # React entry point
        ├── App.js                 # Frontend routing & layout controller
        ├── ThemeContext.js        # Dark/Light mode state provider
        ├── utils/
        │   └── activityLogger.js  # User activity tracking utility
        ├── assets/                # App illustrations & assets
        └── [Components & Styles]  # High-fidelity pages and layout CSS
```

---

## 🚀 Setup & Installation

### 1. Database Setup (MongoDB Atlas)
1. Register a free account on [MongoDB Atlas](https://www.mongodb.com/).
2. Deploy a new Cluster and create a database named `auction_db`.
3. Create collections: `users`, `profiles`, `items`, `bids`, `notifications`, `payments`, `reset_tokens`, and `preferences`.
4. Whitelist your current IP address under **Network Access** in MongoDB Atlas.
5. Copy the connection URI: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority`

---

### 2. Backend Setup
1. Open your terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and configure your environment file `.env` inside the `backend/` directory:
   ```ini
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
   JWT_SECRET=your_jwt_secret_key
   ADMIN_EMAIL=your_admin_email@gmail.com
   MAIL_USERNAME=your_gmail_sender@gmail.com
   MAIL_PASSWORD=your_gmail_app_password
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   ```
3. Install the required python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. (Optional) Run the ML trainer script to initialize `price_estimator.pkl` and `encoders.pkl`:
   ```bash
   python train_price_model.py
   ```
5. Start the Flask application server:
   ```bash
   python app.py
   ```
The backend server runs locally on **`http://localhost:5000/`**.

---

### 3. Frontend Setup
1. Open another terminal window and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Set up the frontend `.env` file:
   ```ini
   REACT_APP_BACKEND_URL=http://localhost:5000
   ```
3. Install standard project node dependencies:
   ```bash
   npm install
   ```
4. Spin up the local development web server:
   ```bash
   npm start
   ```
The frontend dashboard will automatically launch at **`http://localhost:3000/`**.

---

## 🔐 Credentials & Local Verification
*   **Administrator Account**: An admin user is automatically initialized on backend startup using the `ADMIN_EMAIL` provided in your backend `.env` (default temporary password is `admin_password`).
*   **Mail Dispatch**: Make sure your Gmail SMTP password is an **App Password** created via Google Account Security if you have 2FA enabled.

---

### 👩‍💻 Made with 💙 by Students for Students
Crafted as an academic internship project to empower student commerce, reuse, and tech integration in campus environments! 🚀🎓
