import numpy as np
from sklearn.ensemble import RandomForestRegressor

def compute_engagement_score(login_count, chat_replies, meetings_attended,
                              hw_acknowledged, notifications_opened, total_notifications):
    """
    All inputs are counts over last 30 days.
    Returns: score (0-100), level, insights
    """
    notif_open_rate = (notifications_opened / total_notifications * 100) if total_notifications > 0 else 0

    # Weighted scoring
    score = (
        min(login_count, 20)       / 20  * 25 +   # login frequency (max 20 logins = 25pts)
        min(chat_replies, 10)      / 10  * 25 +   # chat responsiveness (max 10 = 25pts)
        min(meetings_attended, 3)  / 3   * 20 +   # meeting participation (max 3 = 20pts)
        min(hw_acknowledged, 10)   / 10  * 15 +   # homework acknowledgement (max 10 = 15pts)
        min(notif_open_rate, 100)  / 100 * 15     # notification open rate (15pts)
    )
    score = round(score, 1)

    if score >= 75:
        level = 'Highly Engaged'
        color = 'green'
    elif score >= 45:
        level = 'Moderately Engaged'
        color = 'yellow'
    else:
        level = 'Low Engagement'
        color = 'red'

    insights = []
    if login_count < 5:
        insights.append('Parent rarely logs in — send re-engagement notification')
    if chat_replies < 2:
        insights.append('Low chat response rate — try SMS or phone call')
    if meetings_attended == 0:
        insights.append('No meetings attended — schedule a parent-teacher meeting')
    if notif_open_rate < 30:
        insights.append('Notifications mostly unread — check contact details')
    if not insights:
        insights.append('Parent is actively involved — keep up the communication')

    return score, level, color, insights
