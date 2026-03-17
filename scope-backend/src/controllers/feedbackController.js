const Feedback = require('../models/Feedback');

exports.submitFeedback = async (req, res) => {
  const feedback = await Feedback.create({ ...req.body, submittedBy: req.user._id, role: req.user.role });
  res.status(201).json(feedback);
};

exports.getFeedbacks = async (req, res) => {
  const filter = req.user.role === 'teacher' ? {} : { submittedBy: req.user._id };
  const feedbacks = await Feedback.find(filter).populate('submittedBy', 'name').sort({ createdAt: -1 });
  res.json(feedbacks);
};

exports.respondFeedback = async (req, res) => {
  const feedback = await Feedback.findByIdAndUpdate(
    req.params.id,
    { response: req.body.response, respondedBy: req.user._id, status: 'resolved' },
    { new: true }
  );
  res.json(feedback);
};
