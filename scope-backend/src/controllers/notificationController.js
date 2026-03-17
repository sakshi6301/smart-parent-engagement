const Notification = require('../models/Notification');
const User = require('../models/User');
const Student = require('../models/Student');
const sendPush = require('../utils/sendPush');
const sendEmail = require('../utils/sendEmail');
const sendSMS = require('../utils/sendSMS');
const buildEmailHtml = require('../utils/emailTemplate');

// ── helpers ──────────────────────────────────────────────────────────────────

const dispatch = async (recipient, title, body, channels = [], type = 'announcement') => {
  if (channels.includes('push') && recipient.fcmToken)
    await sendPush(recipient.fcmToken, title, body);
  if (channels.includes('email') && recipient.email)
    await sendEmail({
      to: recipient.email,
      subject: `SCOPE – ${title}`,
      html: buildEmailHtml({ recipientName: recipient.name, title, body, type }),
    });
  if (channels.includes('sms') && recipient.phone)
    await sendSMS(recipient.phone, `${title}: ${body}`);
};

// ── single send ───────────────────────────────────────────────────────────────

exports.sendNotification = async (req, res) => {
  try {
    const { recipientId, title, body, type, channels = ['push'], relatedStudent } = req.body;
    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ message: 'Recipient not found' });

    const notification = await Notification.create({
      recipient: recipientId, sentBy: req.user._id,
      title, body, type, channels,
      ...(relatedStudent && { relatedStudent }),
    });

    await dispatch(recipient, title, body, channels, type);
    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── broadcast ─────────────────────────────────────────────────────────────────
// audience: 'all_parents' | 'all_teachers' | 'class_<class>_<section>'

exports.broadcast = async (req, res) => {
  try {
    const { title, body, type, channels = ['push'], audience } = req.body;
    if (!title || !body || !type || !audience)
      return res.status(400).json({ message: 'title, body, type, audience required' });

    let recipients = [];

    if (audience === 'all_parents') {
      recipients = await User.find({ role: 'parent', isActive: true });
    } else if (audience === 'all_teachers') {
      recipients = await User.find({ role: 'teacher', isActive: true });
    } else if (audience.startsWith('class_')) {
      // class_5_A  →  class=5, section=A
      const parts = audience.split('_');
      const cls = parts[1];
      const sec = parts[2];
      const students = await Student.find({ class: cls, section: sec, parent: { $exists: true, $ne: null } })
        .populate('parent');
      const seen = new Set();
      students.forEach(s => {
        if (s.parent && !seen.has(String(s.parent._id))) {
          seen.add(String(s.parent._id));
          recipients.push(s.parent);
        }
      });
    } else {
      return res.status(400).json({ message: 'Invalid audience' });
    }

    if (!recipients.length)
      return res.status(404).json({ message: 'No recipients found for this audience' });

    const docs = recipients.map(r => ({
      recipient: r._id, sentBy: req.user._id,
      title, body, type, channels, broadcastGroup: audience,
    }));
    await Notification.insertMany(docs);

    // deliver and log errors
    const results = await Promise.allSettled(
      recipients.map(r => dispatch(r, title, body, channels, type))
    );
    const errors = results.filter(r => r.status === 'rejected').map(r => r.reason?.message);
    if (errors.length) console.error('Delivery errors:', errors);

    res.status(201).json({ sent: recipients.length, audience, deliveryErrors: errors });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── fetch own notifications ───────────────────────────────────────────────────

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 }).limit(100);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── mark one read ─────────────────────────────────────────────────────────────

exports.markRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── mark all read ─────────────────────────────────────────────────────────────

exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── delete one ────────────────────────────────────────────────────────────────

exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── admin: history of all sent notifications ──────────────────────────────────

exports.getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 30, type, audience } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (audience) filter.broadcastGroup = audience;

    const total = await Notification.countDocuments(filter);

    // group by broadcastGroup + title + createdAt (same-second batch = one broadcast)
    // For simplicity: return raw list sorted newest first, frontend groups by broadcastGroup
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('sentBy', 'name role')
      .populate('recipient', 'name role');

    res.json({ total, page: Number(page), notifications });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── admin: summary stats ──────────────────────────────────────────────────────

exports.getStats = async (req, res) => {
  try {
    const total = await Notification.countDocuments();
    const unread = await Notification.countDocuments({ isRead: false });
    const byType = await Notification.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);
    const last7 = await Notification.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json({ total, unread, byType, last7 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
