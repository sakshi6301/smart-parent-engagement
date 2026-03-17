const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  class: { type: String, required: true },
  section: { type: String, required: true },
  subject: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  fileUrl: { type: String },
  dueDate: { type: Date, required: true },
  submissions: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    fileUrl: { type: String },
    submittedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['submitted', 'late', 'graded'], default: 'submitted' },
    marks: { type: Number },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Homework', homeworkSchema);
