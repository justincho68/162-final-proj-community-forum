const admin = require('firebase-admin');
const path = require('path');

//initialize the firebase SDK
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || 
  path.join(__dirname, 'serviceAccountKey.json');

let firebaseApp;

try {
  const serviceAccount = require(serviceAccountPath);
  
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Firebase Admin initialization error:', error.message);
  process.exit(1);
}

module.exports = {
  admin,
  auth: admin.auth(),
  firestore: admin.firestore(), // If you need Firestore
  app: firebaseApp
};