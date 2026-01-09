
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC67cYqknT8GbQ-4zUg5hZXBQ209kDs1vI",
  authDomain: "digitalsight-7d498.firebaseapp.com",
  databaseURL: "https://digitalsight-7d498-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "digitalsight-7d498",
  storageBucket: "digitalsight-7d498.firebasestorage.app",
  messagingSenderId: "220340840910",
  appId: "1:220340840910:web:4db9a30eec3f3916cde39f",
  measurementId: "G-43564EVJ55"
};

// Initialize primary app
const app = initializeApp(firebaseConfig);

// Initialize secondary app for admin actions (creating users)
// This prevents the current admin from being logged out when calling createUser
const secondaryApp = !getApps().find(a => a.name === 'Secondary') 
  ? initializeApp(firebaseConfig, 'Secondary') 
  : getApp('Secondary');

export const db = getDatabase(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export const secondaryAuth = getAuth(secondaryApp);
