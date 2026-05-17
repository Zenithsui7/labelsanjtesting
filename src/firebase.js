// ─── src/firebase.js ─────────────────────────────────────────────────────────
// Replace the values below with YOUR Firebase project config.
// Instructions: FIREBASE_SETUP.md → Step 2

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBCpw83tcyGHNXJmiDKiaYQkKXKoUsL-H4",
  authDomain: "label-sanj.firebaseapp.com",
  databaseURL: "https://label-sanj-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "label-sanj",
  storageBucket: "label-sanj.firebasestorage.app",
  messagingSenderId: "82906631288",
  appId: "1:82906631288:web:cb96efb7e65b492f65318d",
  measurementId: "G-HVZ7H6RH6K"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
export const storage = getStorage(app);

// ── Google Auth ──────────────────────────────────────────────────────────────
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Simple Google sign-in helper (used by Admin UI)
export async function signInWithGooglePopup() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

// Upload file to Firebase Storage and return download URL
export function uploadFile(file, path) {
  return new Promise((resolve, reject) => {
    const sRef = storageRef(storage, path);
    const uploadTask = uploadBytesResumable(sRef, file);
    uploadTask.on('state_changed', null, (err) => reject(err), async () => {
      try {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      } catch (e) { reject(e); }
    });
  });
}

// ── Phone Auth helpers ───────────────────────────────────────────────────────
// Call once per sign-in attempt; pass the id of the invisible div in your JSX.
export function setupRecaptcha(containerId) {
  if (window._recaptchaVerifier) {
    window._recaptchaVerifier.clear();
  }
  window._recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {},
    "expired-callback": () => {
      window._recaptchaVerifier = null;
    },
  });
  return window._recaptchaVerifier;
}

export { signInWithPhoneNumber };
