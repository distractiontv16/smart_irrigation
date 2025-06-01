// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDF1AQFeDeSuIxJTGZp8J2bXbPOl1AJa5I",
  authDomain: "irrigation-84812.firebaseapp.com",
  projectId: "irrigation-84812",
  storageBucket: "irrigation-84812.firebasestorage.app",
  messagingSenderId: "419481684389",
  appId: "1:419481684389:web:245854c5af16fe5c42804c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app, auth, db, storage };
export default app;