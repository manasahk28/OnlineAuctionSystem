import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from joblib import dump

# Sample training data
data = pd.DataFrame({
    'category': ['Electronics', 'Books', 'Clothing', 'Electronics', 'Books'],
    'item_condition': ['New', 'Used', 'Used', 'New', 'Refurbished'],
    'tags': ['smartphone', 'fiction', 'shirt', 'tablet', 'novel'],
    'duration': [3, 5, 2, 7, 4],
    'starting_price': [5000, 300, 400, 7000, 250],
    'damage_level': ['none', 'minor', 'major', 'none', 'minor'],
    'estimated_price': [8500, 500, 450, 11000, 420]
})

# Label encoding
encoders = {}
for col in ['category', 'item_condition', 'tags', 'damage_level']:
    le = LabelEncoder()
    data[col] = le.fit_transform(data[col])
    encoders[col] = le

# Features and target
X = data[['category', 'item_condition', 'tags', 'duration', 'starting_price', 'damage_level']]
y = data['estimated_price']

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
model = LinearRegression()
model.fit(X_train, y_train)

# Save model and encoders
dump(model, 'price_estimator.pkl')
dump(encoders, 'encoders.pkl')

print("Linear Regression model and encoders saved.")

