const admin = require('firebase-admin');

let initialized = false;

const getAdmin = () => {
  if (initialized) return admin;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || privateKey.includes('...') || !clientEmail) {
    console.warn('⚠️  Firebase not configured — push notifications disabled.');
    return null;
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey: privateKey.replace(/\\n/g, '\n'),
        clientEmail,
      }),
    });
  }

  initialized = true;
  return admin;
};

module.exports = getAdmin;
