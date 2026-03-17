import numpy as np
from sklearn.linear_model import LinearRegression

def predict_grade_trend(scores):
    """
    scores: list of floats (percentages) in chronological order
    Returns: predicted_next, trend_direction, slope
    """
    if len(scores) < 2:
        return None, 'stable', 0.0

    X = np.arange(len(scores)).reshape(-1, 1)
    y = np.array(scores)

    model = LinearRegression()
    model.fit(X, y)

    next_x = np.array([[len(scores)]])
    predicted = float(model.predict(next_x)[0])
    predicted = max(0.0, min(100.0, round(predicted, 1)))

    slope = round(float(model.coef_[0]), 2)
    if slope > 1.5:
        direction = 'improving'
    elif slope < -1.5:
        direction = 'declining'
    else:
        direction = 'stable'

    return predicted, direction, slope
