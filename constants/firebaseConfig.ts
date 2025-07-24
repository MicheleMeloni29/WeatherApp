// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBMUeDrhMS5BAi0d05wFjyAEq4-DCxlUyw",
    authDomain: "weatherapp-251cb.firebaseapp.com",
    projectId: "weatherapp-251cb",
    storageBucket: "weatherapp-251cb.appspot.com",
    messagingSenderId: "345938890404",
    appId: "1:345938890404:web:862712f727697c5b5f6031",
    measurementId: "G-087E5HQ9LG"
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// Inizializza Firebase Auth per React Native
// Note: Firebase v11+ handles React Native persistence automatically
const auth = getAuth(app);

// Inizializza Firestore Database
const db = getFirestore(app);

export { auth, db };