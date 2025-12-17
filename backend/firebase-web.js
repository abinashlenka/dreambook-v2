// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");

const firebaseConfig = {
    apiKey: "AIzaSyCVox7G0GC2f8TlN2z1_4ENWFi2fJQL8D8",
    authDomain: "dreambook-publishing-9e68a.firebaseapp.com",
    projectId: "dreambook-publishing-9e68a",
    storageBucket: "dreambook-publishing-9e68a.firebasestorage.app",
    messagingSenderId: "583208211707",
    appId: "1:583208211707:web:8357fe35d2a6f7eed24c5e",
    measurementId: "G-0TH43PHSGS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// // TODO: Add SDKs for Firebase products that you want to use
// // https://firebase.google.com/docs/web/setup#available-libraries

// // Your web app's Firebase configuration
// // For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyDeOim3XtdHSkymypWlseyuWt-o47ekiqw",
//   authDomain: "dream-books-7bbfa.firebaseapp.com",
//   projectId: "dream-books-7bbfa",
//   storageBucket: "dream-books-7bbfa.firebasestorage.app",
//   messagingSenderId: "567740178496",
//   appId: "1:567740178496:web:f7b4b04886ea93715effa5",
//   measurementId: "G-9QE7EEF5ZE"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);