const mongoose = require('mongoose');

const engagementSchema = new mongoose.Schema({
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  month: { type: String, required: true }, // "2024-01"
  appLogins: { type: Number, default: 0 },
  homeworkChecks: { type: Number, default: 0 },
  teacherMessages: { type: Number, default: 0 },
  meetingsAttended: { type: Number, default: 0 },
  notificationsRead: { type: Number, default: 0 },
  score: { type: Number, default: 0 }, // 0-100
  level: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
}, { timestamps: true });

engagementSchema.index({ parent: 1, student: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Engagement', engagementSchema);
