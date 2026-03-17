const sendSMS = async (to, body) => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !sid.startsWith('AC')) {
    console.warn('⚠️  Twilio not configured — SMS disabled.');
    return;
  }

  try {
    const twilio = require('twilio')(sid, token);
    await twilio.messages.create({ body, from: process.env.TWILIO_PHONE, to });
  } catch (err) {
    console.error('SMS error:', err.message);
  }
};

module.exports = sendSMS;
