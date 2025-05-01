// Firebase configuration template
// Copy this file to firebase.js and replace the values with your Firebase config

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, doc, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { query, where, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase variables
let app, db, storage, auth, provider, imagesRef;

function initializeFirebase() {
    try {
        // Initialize Firebase
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        storage = getStorage(app);
        auth = getAuth(app);
        provider = new GoogleAuthProvider();
        imagesRef = ref(storage, 'images');

        console.log('Firebase initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'firebase-error';
        errorDiv.textContent = `Failed to initialize Firebase: ${error.message}. Please check your configuration.`;
        document.body.prepend(errorDiv);
        throw error;
    }
}

// Initialize Firebase when the module loads
initializeFirebase();

// Export initialized services
export { db, imagesRef, auth, collection, doc, getDoc, getDocs, provider, createUserWithEmailAndPassword, signInWithEmailAndPassword, query, where, deleteDoc };

