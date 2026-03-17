from flask import Blueprint, request, jsonify
from models.risk_model import predict_risk, train_model
from models.recommendation import get_recommendations
from models.grade_trend import predict_grade_trend
from models.attendance_anomaly import detect_attendance_anomaly
from models.engagement_score import compute_engagement_score

ai_routes = Blueprint('ai', __name__)

@ai_routes.route('/predict/risk', methods=['POST'])
def risk_prediction():
    data = request.get_json()
    attendance_pct = float(data.get('attendance_pct', 0))
    avg_grade = float(data.get('avg_grade', 0))
    hw_completion_rate = float(data.get('hw_completion_rate', 0))

    risk_level, confidence = predict_risk(attendance_pct, avg_grade, hw_completion_rate)

    suggestions = {
        'high': ['Schedule parent meeting immediately', 'Assign extra tutoring', 'Daily progress monitoring'],
        'medium': ['Send weekly progress report', 'Recommend additional practice', 'Parent awareness notification'],
        'low': ['Maintain current performance', 'Encourage participation in activities']
    }

    return jsonify({
        'risk_level': risk_level,
        'confidence': confidence,
        'suggestions': suggestions.get(risk_level, [])
    })

@ai_routes.route('/recommend/learning', methods=['POST'])
def learning_recommendations():
    data = request.get_json()
    weak_subjects = data.get('weak_subjects', [])
    recommendations = get_recommendations(weak_subjects)
    return jsonify({'recommendations': recommendations})

@ai_routes.route('/train', methods=['POST'])
def retrain():
    train_model()
    return jsonify({'message': 'Model retrained successfully'})

@ai_routes.route('/predict/grade-trend', methods=['POST'])
def grade_trend():
    data = request.get_json()
    # subjects: { "Math": [scores...], "Science": [scores...] }
    subjects = data.get('subjects', {})
    result = {}
    for subject, scores in subjects.items():
        predicted, direction, slope = predict_grade_trend(scores)
        result[subject] = {
            'predicted_next': predicted,
            'trend': direction,
            'slope': slope,
            'scores': scores
        }
    return jsonify({'trends': result})

@ai_routes.route('/predict/attendance-anomaly', methods=['POST'])
def attendance_anomaly():
    data = request.get_json()
    records = data.get('records', [])  # [{ date, status }]
    is_anomaly, risk_type, message = detect_attendance_anomaly(records)
    return jsonify({'is_anomaly': is_anomaly, 'risk_type': risk_type, 'message': message})

@ai_routes.route('/predict/engagement', methods=['POST'])
def engagement():
    data = request.get_json()
    score, level, color, insights = compute_engagement_score(
        data.get('login_count', 0),
        data.get('chat_replies', 0),
        data.get('meetings_attended', 0),
        data.get('hw_acknowledged', 0),
        data.get('notifications_opened', 0),
        data.get('total_notifications', 0)
    )
    return jsonify({'score': score, 'level': level, 'color': color, 'insights': insights})
