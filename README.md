# Online Auction System


### 🧠 Backend:
- Python 3.10+  
- Flask  
- requests  
- flask-cors
  
### 🌍 Frontend:
 - React Js


### 🔗 SheetDB Setup
You're using SheetDB to store user data.

##### Create a Google Sheet with columns:
UserName, collegeId, collegeName, email, password, timestamp

Connect it via SheetDB and grab the API endpoint (e.g. https://sheetdb.io/api/v1/xxxxxx)

##### Paste that into your app.py:
python
Copy
Edit
SHEETDB_API_URL = "https://sheetdb.io/api/v1/YOUR_API_ID"

### 🧪 Running the App
1️⃣ Start the Flask backend:
bash
Copy
Edit
cd backend
python app.py


Install backend dependencies with:
```bash
pip install flask flask-cors requests
  
Install frontend dependencies with:
```bash
cd frontend
npm install

a)Start React Frontend:
 bash
 cd frontend
 npm start

