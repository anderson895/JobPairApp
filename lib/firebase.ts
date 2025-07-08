import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDVK96ZVfPWXiqNh23XEnVAJyMpmW-Hj8k',
  authDomain: 'jobpair-bf0d9.firebaseapp.com',
  projectId: 'jobpair-bf0d9',
  storageBucket: 'jobpair-bf0d9.firebasestorage.app',
  messagingSenderId: '56028384970',
  appId: '1:56028384970:web:9700983425d568de086e33',
  measurementId: 'G-RFMHR0PP2R',
};
console.log("🔥 Firebase API Key:", firebaseConfig.apiKey);
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
