from flask import Blueprint, request, jsonify
from models.risk_model import predict_risk, train_model
from models.recommendation import get_recommendations

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
