import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAVi3eUeQyBVog_CGEvK_OwO41-QxklwZc",
  authDomain: "stkpush-cff51.firebaseapp.com",
  databaseURL: "https://stkpush-cff51-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "stkpush-cff51",
  storageBucket: "stkpush-cff51.firebasestorage.app",
  messagingSenderId: "567137630101",
  appId: "1:567137630101:web:50be4c8df9df506131289c",
  measurementId: "G-NWB29K3M20"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();