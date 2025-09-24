import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDv7goA31q-pu1VJssu_V8-2HBGSArMGKk',
  authDomain: 'phiso-quizzi.firebaseapp.com',
  projectId: 'phiso-quizzi',
  storageBucket: 'phiso-quizzi.appspot.com',
  messagingSenderId: '690755271088',
  appId: '1:690755271088:web:671f8b2b55c27125c4db02',
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)

console.log('🔥 Firebase initialized:', app)
