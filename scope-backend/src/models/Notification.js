const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sentBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title:          { type: String, required: true },
  body:           { type: String, required: true },
  type:           { type: String, enum: ['absence', 'performance', 'homework', 'exam', 'announcement', 'meeting'], required: true },
  channels:       [{ type: String, enum: ['push', 'email', 'sms'] }],
  isRead:         { type: Boolean, default: false },
  relatedStudent: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  broadcastGroup: { type: String },
  expiresAt:      { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }, // 30 days default
}, { timestamps: true });

// MongoDB TTL index — auto deletes document when expiresAt is reached
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Notification', notificationSchema);
