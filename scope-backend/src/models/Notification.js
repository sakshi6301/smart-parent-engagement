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
  broadcastGroup: { type: String }, // 'all_parents' | 'all_teachers' | 'class_X_Y' | null
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
