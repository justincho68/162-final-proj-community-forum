import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDzNs-Y1rxbmGKM65buolkg_YIUvNEXxh0",
  authDomain: "davis-bulletin.firebaseapp.com",
  projectId: "davis-bulletin",
  storageBucket: "davis-bulletin.firebasestorage.app",
  messagingSenderId: "148917111329",
  appId: "1:148917111329:web:2d5869a2abffebb4723160"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);