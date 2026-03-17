const getAdmin = require('../config/firebase');

const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) return;
  const admin = getAdmin();
  if (!admin) return;
  try {
    await admin.messaging().send({ token: fcmToken, notification: { title, body }, data });
  } catch (err) {
    console.error('FCM error:', err.message);
  }
};

module.exports = sendPushNotification;
