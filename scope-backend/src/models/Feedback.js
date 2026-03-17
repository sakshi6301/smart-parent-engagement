const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['parent', 'student'], required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  category: { type: String, enum: ['academic_stress', 'learning_difficulty', 'school_issue', 'general'], required: true },
  message: { type: String, required: true },
  emotion: { type: String, enum: ['happy', 'neutral', 'sad', 'stressed', 'confused'] },
  response: { type: String },
  respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['open', 'in_review', 'resolved'], default: 'open' },
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
