const Engagement = require('../models/Engagement');

const calculateEngagementScore = (data) => {
  const weights = { appLogins: 20, homeworkChecks: 25, teacherMessages: 25, meetingsAttended: 20, notificationsRead: 10 };
  const maxValues = { appLogins: 20, homeworkChecks: 10, teacherMessages: 10, meetingsAttended: 2, notificationsRead: 20 };

  let score = 0;
  for (const key of Object.keys(weights)) {
    const ratio = Math.min(data[key] / maxValues[key], 1);
    score += ratio * weights[key];
  }

  const level = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
  return { score: Math.round(score), level };
};

const updateEngagement = async (parentId, studentId, field) => {
  const month = new Date().toISOString().slice(0, 7);
  const engagement = await Engagement.findOneAndUpdate(
    { parent: parentId, student: studentId, month },
    { $inc: { [field]: 1 } },
    { upsert: true, new: true }
  );
  const { score, level } = calculateEngagementScore(engagement.toObject());
  engagement.score = score;
  engagement.level = level;
  await engagement.save();
};

module.exports = { calculateEngagementScore, updateEngagement };
