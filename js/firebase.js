import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDUPToJEvhFAIoNWU3jC4OLGwN2wcL8uOg",
  authDomain: "scannow-df837.firebaseapp.com",
  projectId: "scannow-df837",
  storageBucket: "scannow-df837.firebasestorage.app",
  messagingSenderId: "526719676181",
  appId: "1:526719676181:web:7f6c4a5a84c2336981c31c",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
