// src/config/firebase.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, GoogleAuthProvider } from 'firebase/auth';
import { getMessaging, getToken, onMessage } from "firebase/messaging";



const firebaseConfig = {
    apiKey: "AIzaSyCVox7G0GC2f8TlN2z1_4ENWFi2fJQL8D8",
    authDomain: "dreambook-publishing-9e68a.firebaseapp.com",
    projectId: "dreambook-publishing-9e68a",
    storageBucket: "dreambook-publishing-9e68a.appspot.com",
    messagingSenderId: "583208211707",
    appId: "1:583208211707:web:8357fe35d2a6f7eed24c5e",
    measurementId: "G-0TH43PHSGS"
  };

  
// Initialize Firebase
let app;
let messagingInstance;

try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
} catch (error) {
  console.error("Firebase initialization error:", error);
  app = getApp();
}

// Initialize services
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Set up persistence and messaging (client-side only)
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch(console.error);
  messagingInstance = getMessaging(app);
}

// FCM onMessage listener
const onMessageListener = (callback) => {
  if (!messagingInstance) return;
    return onMessage(messagingInstance, callback);
};

// Request FCM token helper
const requestFCMToken = async () => {
    if (!messagingInstance) return null;
    try {
        const token = await getToken(messagingInstance, {
            vapidKey:"BLIJHBtpDW6t_RXJES6sml7UtHjJfP53TwQrmpqLPtepTxpRXs9DqHhs14mT0c7FcHzymm2i1L89Rz8MEOycNH0",
        });
        return token;
    } catch (err) {
        console.error("Error getting FCM token:", err);
        return null;
    }
};

// Export all Firebase services
export { auth, googleProvider, onMessageListener, requestFCMToken };

export const messaging = messagingInstance;
