import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCF-8qkuyMZwmc29CuMbfnBtZM1aQEE_E4",
  authDomain: "book-archive-1b6c6.firebaseapp.com",
  projectId: "book-archive-1b6c6",
  storageBucket: "book-archive-1b6c6.firebasestorage.app",
  messagingSenderId: "375965339215",
  appId: "1:375965339215:web:7ad4ff0202f44cef2fa43a"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
