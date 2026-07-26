import { initializeApp } from 'firebase/app';
import {
    initializeFirestore,
    persistentLocalCache,
    persistentSingleTabManager
} from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const missing = Object.entries(firebaseConfig).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
    console.error('CRITICAL: Firebase config missing keys:', missing.join(', '));
}

export const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({
        tabManager: persistentSingleTabManager({ forceOwnership: true })
    }),
    experimentalAutoDetectLongPolling: true
});

export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(err => {
    console.error('Firebase Auth persistence error:', err);
});

export const ADMIN_USERNAME = 'admin';
export const ADMIN_EMAIL = 'nguyenthanhdat.lamson@gmail.com';
