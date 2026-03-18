const Message = require('../models/Message');
const Meeting = require('../models/Meeting');
const Notification = require('../models/Notification');
const { updateEngagement } = require('../utils/engagementHelper');
const Student = require('../models/Student');
const sendEmail = require('../utils/sendEmail');
const buildEmailHtml = require('../utils/emailTemplate');

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
  const meeting = await Meeting.findByIdAndUpdate(req.params.id, req.body, { new: true })
    .populate('parent teacher student', 'name email fcmToken');
  if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

  // Notify parent on confirm or cancel
  const { status, confirmedSlot } = req.body;
  if (status === 'confirmed' || status === 'cancelled') {
    const parent = meeting.parent;
    const slotStr = confirmedSlot
      ? new Date(confirmedSlot).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
      : new Date(meeting.requestedSlot).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const title = status === 'confirmed' ? 'Meeting Confirmed' : 'Meeting Cancelled';
    const body = status === 'confirmed'
      ? `Your meeting with ${meeting.teacher.name} is confirmed for ${slotStr}`
      : `Your meeting request with ${meeting.teacher.name} has been declined.`;

    await Notification.create({ recipient: parent._id, sentBy: req.user._id, title, body, type: 'meeting' });
    if (parent.email) {
      sendEmail({ to: parent.email, subject: `SCOPE - ${title}`, html: buildEmailHtml({ recipientName: parent.name, title, body, type: 'meeting' }) }).catch(() => {});
    }
  }

  res.json(meeting);
};
