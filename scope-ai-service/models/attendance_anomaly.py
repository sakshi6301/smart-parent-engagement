import numpy as np
from sklearn.ensemble import IsolationForest

def detect_attendance_anomaly(daily_records):
    """
    daily_records: list of dicts { date, status }
    status: 'present'=1, 'absent'=0, 'late'=0.5
    Returns: is_anomaly (bool), risk_type, message
    """
    if len(daily_records) < 7:
        return False, None, 'Not enough data'

    status_map = {'present': 1.0, 'late': 0.5, 'absent': 0.0}
    values = [status_map.get(r['status'], 0) for r in daily_records]

    # Rolling 7-day windows as features
    windows = []
    for i in range(len(values) - 6):
        w = values[i:i+7]
        windows.append([np.mean(w), np.min(w), np.sum([1 for x in w if x == 0])])

    X = np.array(windows)
    model = IsolationForest(contamination=0.1, random_state=42)
    preds = model.fit_predict(X)

    # Check last window
    is_anomaly = preds[-1] == -1

    # Additional rule-based checks
    recent = values[-7:]
    recent_absences = recent.count(0.0)
    total_pct = (sum(values) / len(values)) * 100

    risk_type = None
    message = 'Attendance pattern is normal'

    if recent_absences >= 3:
        risk_type = 'frequent_absence'
        message = f'{recent_absences} absences in last 7 days — parent alert recommended'
    elif is_anomaly and total_pct >= 75:
        risk_type = 'sudden_drop'
        message = 'Sudden change in attendance pattern detected'
    elif total_pct < 75:
        risk_type = 'below_threshold'
        message = f'Attendance {round(total_pct,1)}% is below 75% threshold'

    return bool(risk_type), risk_type, message
