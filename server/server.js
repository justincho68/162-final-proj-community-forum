const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const serviceAccount = require('./davis-bulletin-firebase-adminsdk-fbsvc-18767acbf6.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const app = express();
const PORT = process.env.PORT || 4000;

//using CORS to allow react to call API
app.use(cors());

//fetching events through API
app.get('/api/events', async (req, res) => {
    try {
        const querySnapshot = await db.collection('events').get();
        const events = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json(events);
    } catch (error) {
    }
});

//starting the server
api.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});