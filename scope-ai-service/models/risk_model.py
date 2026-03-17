import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'risk_model.pkl')

def generate_training_data(n=500):
    np.random.seed(42)
    attendance = np.random.uniform(20, 100, n)
    grades = np.random.uniform(20, 100, n)
    hw_completion = np.random.uniform(0, 100, n)

    def label(a, g, h):
        score = (a * 0.4) + (g * 0.4) + (h * 0.2)
        if score >= 70: return 'low'
        if score >= 45: return 'medium'
        return 'high'

    labels = [label(a, g, h) for a, g, h in zip(attendance, grades, hw_completion)]
    return pd.DataFrame({'attendance_pct': attendance, 'avg_grade': grades, 'hw_completion_rate': hw_completion, 'risk': labels})

def train_model():
    df = generate_training_data()
    X = df[['attendance_pct', 'avg_grade', 'hw_completion_rate']]
    le = LabelEncoder()
    y = le.fit_transform(df['risk'])

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)
    joblib.dump({'model': model, 'encoder': le}, MODEL_PATH)
    print("Model trained and saved.")
    return model, le

def load_model():
    if not os.path.exists(MODEL_PATH):
        return train_model()
    saved = joblib.load(MODEL_PATH)
    return saved['model'], saved['encoder']

def predict_risk(attendance_pct, avg_grade, hw_completion_rate):
    model, le = load_model()
    X = np.array([[attendance_pct, avg_grade, hw_completion_rate]])
    pred = model.predict(X)[0]
    proba = model.predict_proba(X)[0]
    risk_label = le.inverse_transform([pred])[0]
    confidence = round(float(max(proba)) * 100, 1)
    return risk_label, confidence
