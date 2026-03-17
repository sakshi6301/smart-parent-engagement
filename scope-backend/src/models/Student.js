const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({

  // ── Basic Identity ──
  name:             { type: String, required: true, trim: true },
  rollNumber:       { type: String, required: true, unique: true, trim: true },
  admissionNumber:  { type: String, unique: true, sparse: true, trim: true },
  dateOfBirth:      { type: Date, required: true },
  gender:           { type: String, enum: ['male', 'female', 'other'], required: true },
  bloodGroup:       { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-','unknown'], default: 'unknown' },
  nationality:      { type: String, default: 'Indian' },
  religion:         { type: String },
  category:         { type: String, enum: ['general','obc','sc','st','nt','other'], default: 'general' },
  photo:            { type: String }, // URL

  // ── Academic Info ──
  class:            { type: String, required: true },
  section:          { type: String, required: true },
  academicYear:     { type: String, required: true }, // e.g. "2024-25"
  admissionDate:    { type: Date, default: Date.now },
  previousSchool:   { type: String },
  medium:           { type: String, enum: ['english','hindi','marathi','semi-english'], default: 'english' },
  house:            { type: String }, // school house e.g. Red, Blue

  // ── Contact Info ──
  phone:            { type: String },
  email:            { type: String, lowercase: true }, // student personal email
  address:          { type: String },
  city:             { type: String },
  state:            { type: String },
  pincode:          { type: String },

  // ── Father's Info ──
  fatherName:       { type: String },
  fatherPhone:      { type: String },
  fatherOccupation: { type: String },
  fatherEmail:      { type: String, lowercase: true },

  // ── Mother's Info ──
  motherName:       { type: String },
  motherPhone:      { type: String },
  motherOccupation: { type: String },
  motherEmail:      { type: String, lowercase: true },

  // ── Guardian (if different from parents) ──
  guardianName:     { type: String },
  guardianPhone:    { type: String },
  guardianRelation: { type: String },

  // ── Emergency Contact ──
  emergencyContact: { type: String },
  emergencyName:    { type: String },
  emergencyRelation:{ type: String },

  // ── Medical Info ──
  medicalConditions:{ type: String },
  allergies:        { type: String },
  specialNeeds:     { type: String },

  // ── Transport ──
  transportMode:    { type: String, enum: ['school_bus','private','walking','other'], default: 'other' },
  busRoute:         { type: String },

  // ── System Links ──
  parent:           { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  teacher:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  studentUser:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // ── Status ──
  isActive:         { type: Boolean, default: true },
  leftDate:         { type: Date },
  leftReason:       { type: String },
  tcIssued:         { type: Boolean, default: false }, // Transfer Certificate

}, { timestamps: true });

// Virtual: age
studentSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  return Math.floor((Date.now() - new Date(this.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
});

module.exports = mongoose.model('Student', studentSchema);
