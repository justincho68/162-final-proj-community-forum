const { auth } = require('../config/firebase');
const User = require('../models/User');


//verify the firebase token and then attach it to the request
const verifyFirebaseToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: "No token provided or invalid format"
            });
        }
        const token = authHeader.split('Bearer ')[1];

        //verify the firebase token
        const decodedToken = await auth.verifyIdToken(token);

        //either find user in mongodb or create it
        let user = await User.findByFirebaseUid(decodedToken.uid);
        if (!user) {
            user = await User.createFromFirebaseUser({
                uid: decodedToken.uid,
                email: decodedToken.email,
                displayName: decodedToken.name,
                photoURL: decodedToken.picture
              });
              console.log(`New user created in MongoDB: ${user.email}`)
        }
        //update the last login
        await user.updateLastLogin();
        req.firebaseUser = decodedToken;
        req.user = user;
        next();
    } catch (error) {
        console.error("authentication error: ", error);
        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({
                error: 'Token expired', 
                code: 'TOKEN_EXPIRED' 
            });
        }
    }
}