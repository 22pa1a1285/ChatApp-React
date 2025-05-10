
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "chat-app-c6662.firebaseapp.com",
  projectId: "chat-app-c6662",
  storageBucket: "chat-app-c6662.firebasestorage.app",
  messagingSenderId: "1088889317979",
  appId: "1:1088889317979:web:9ff950011118851d77ed7e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth();
export const db = getFirestore();
export const storage=getStorage();
