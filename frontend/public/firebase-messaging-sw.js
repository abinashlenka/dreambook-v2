// public/firebase-messaging-sw.js

// Use compat libraries instead of v9 modular
importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js");

// Firebase config
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
firebase.initializeApp(firebaseConfig);

// Get messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log("[firebase-messaging-sw.js] Background message received:", payload);

  const notificationTitle = payload.notification.title || "Notification";
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/firebase-logo.png"
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
