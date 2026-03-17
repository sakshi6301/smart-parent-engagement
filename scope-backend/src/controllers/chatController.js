const Message = require('../models/Message');
const Meeting = require('../models/Meeting');
const { updateEngagement } = require('../utils/engagementHelper');
const Student = require('../models/Student');

exports.getMessages = async (req, res) => {
  const messages = await Message.find({ roomId: req.params.roomId })
    .populate('sender', 'name role')
    .sort({ createdAt: 1 });
  res.json(messages);
};

exports.sendMessage = async (req, res) => {
  const { roomId, content, type, fileUrl } = req.body;
  const message = await Message.create({ roomId, sender: req.user._id, content, type, fileUrl });
  const populated = await message.populate('sender', 'name role');

  // Track engagement if sender is parent
  if (req.user.role === 'parent') {
    const student = await Student.findOne({ parent: req.user._id });
    if (student) await updateEngagement(req.user._id, student._id, 'teacherMessages');
  }

  req.app.get('io').to(roomId).emit('newMessage', populated);
  res.status(201).json(populated);
};

exports.requestMeeting = async (req, res) => {
  const meeting = await Meeting.create({ ...req.body, parent: req.user._id });
  res.status(201).json(meeting);
};

exports.getMeetings = async (req, res) => {
  const filter = req.user.role === 'teacher' ? { teacher: req.user._id } : { parent: req.user._id };
  const meetings = await Meeting.find(filter).populate('parent teacher student', 'name email');
  res.json(meetings);
};

exports.updateMeeting = async (req, res) => {
  const meeting = await Meeting.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(meeting);
};
