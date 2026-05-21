import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import cross_val_score
import joblib
import os
import io

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'risk_model.pkl')
REQUIRED_COLS = {'attendance_pct', 'avg_grade', 'hw_completion_rate', 'risk'}

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

def train_model(df=None):
    if df is None:
        df = generate_training_data()
        source = 'synthetic'
    else:
        source = 'real'

    X = df[['attendance_pct', 'avg_grade', 'hw_completion_rate']]
    le = LabelEncoder()
    y = le.fit_transform(df['risk'])

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)

    scores = cross_val_score(model, X, y, cv=min(5, len(df)//10 or 2), scoring='accuracy')
    accuracy = round(float(scores.mean()) * 100, 1)

    joblib.dump({'model': model, 'encoder': le, 'source': source, 'accuracy': accuracy, 'samples': len(df)}, MODEL_PATH)
    print(f"Model trained on {source} data — {len(df)} samples, accuracy: {accuracy}%")
    return model, le, accuracy, source

def train_from_csv(csv_bytes):
    df = pd.read_csv(io.BytesIO(csv_bytes))
    missing = REQUIRED_COLS - set(df.columns)
    if missing:
        raise ValueError(f"CSV missing columns: {missing}. Required: {REQUIRED_COLS}")
    df = df[list(REQUIRED_COLS)].dropna()
    df['attendance_pct']    = pd.to_numeric(df['attendance_pct'], errors='coerce')
    df['avg_grade']         = pd.to_numeric(df['avg_grade'], errors='coerce')
    df['hw_completion_rate']= pd.to_numeric(df['hw_completion_rate'], errors='coerce')
    df['risk']              = df['risk'].str.lower().str.strip()
    df = df[df['risk'].isin(['low', 'medium', 'high'])].dropna()
    if len(df) < 20:
        raise ValueError(f"Need at least 20 valid rows, got {len(df)}")
    return train_model(df)

def load_model():
    if not os.path.exists(MODEL_PATH):
        model, le, _, _ = train_model()
        return model, le
    saved = joblib.load(MODEL_PATH)
    return saved['model'], saved['encoder']

def get_model_info():
    if not os.path.exists(MODEL_PATH):
        return {'source': 'not trained', 'accuracy': 0, 'samples': 0}
    saved = joblib.load(MODEL_PATH)
    return {'source': saved.get('source','unknown'), 'accuracy': saved.get('accuracy', 0), 'samples': saved.get('samples', 0)}

def predict_risk(attendance_pct, avg_grade, hw_completion_rate):
    model, le = load_model()
    X = np.array([[attendance_pct, avg_grade, hw_completion_rate]])
    pred = model.predict(X)[0]
    proba = model.predict_proba(X)[0]
    risk_label = le.inverse_transform([pred])[0]
    confidence = round(float(max(proba)) * 100, 1)
    return risk_label, confidence
