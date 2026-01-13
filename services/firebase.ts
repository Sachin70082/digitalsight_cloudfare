
(self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';
// import { getStorage } from 'firebase/storage';
// @fix: Use namespace import to bypass named export resolution issues with firebase/auth types in this environment
import * as authExports from 'firebase/auth';

import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

if (location.hostname === "localhost") {
  (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
}


const getAuth = (authExports as any).getAuth;

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize primary app
const app = initializeApp(firebaseConfig);

/*
initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider("6LeLuDMsAAAAAFbt7or2TUzG2I6TIBKAeuQKOxyT"),
  isTokenAutoRefreshEnabled: true
});
*/

const secondaryApp = !getApps().find(a => a.name === 'Secondary')
  ? initializeApp(firebaseConfig, 'Secondary')
  : getApp('Secondary');

/*
initializeAppCheck(secondaryApp, {
  provider: new ReCaptchaV3Provider("6LeLuDMsAAAAAFbt7or2TUzG2I6TIBKAeuQKOxyT"),
  isTokenAutoRefreshEnabled: true
});
*/


export const auth = getAuth(app);
export const db = getDatabase(app);
// Firebase Storage is deprecated in favor of Cloudflare R2 for album artwork and audio files
// export const storage = getStorage(app);
export const secondaryAuth = getAuth(secondaryApp); // only for creating users

