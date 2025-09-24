import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBUyaM2ycydkgskj8egUlYrEE9qzyC9BgU',
  authDomain: 'quiz-app-1511b.firebaseapp.com',
  projectId: 'quiz-app-1511b',
  storageBucket: 'quiz-app-1511b.firebasestorage.app',
  messagingSenderId: '581088827631',
  appId: '1:581088827631:web:02739705d8210fe18f231a',
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)

console.log('🔥 Firebase initialized:', app)
