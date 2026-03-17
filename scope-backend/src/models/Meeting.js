const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  requestedSlot: { type: Date, required: true },
  confirmedSlot: { type: Date },
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
  agenda: { type: String },
  notes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);
