const admin = require('firebase-admin');

//initialize firebase admin sdk
const serviceAccount = require('./serviceAccountKey.json')

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'davis-bulletin'
});

const db = admin.firestore();
module.exports(admin, db);


