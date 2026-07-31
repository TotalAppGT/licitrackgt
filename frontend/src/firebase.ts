import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyBtdzASSqHz2oirxJGl6deGkfIUBMUnO_c",
  authDomain: "totalappgt-d15b9.firebaseapp.com",
  projectId: "totalappgt-d15b9",
  storageBucket: "totalappgt-d15b9.firebasestorage.app",
  messagingSenderId: "776610472252",
  appId: "1:776610472252:web:d10290bd749870ef18be39"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password)
}

export async function registerWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password)
}

export async function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider)
}

export async function logoutFirebase() {
  return signOut(auth)
}
