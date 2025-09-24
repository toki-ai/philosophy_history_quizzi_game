import { useEffect, useState } from 'react'
import { db } from './firebase/config'
import { doc, setDoc, getDoc } from 'firebase/firestore'

export default function TestFirestore() {
  const [status, setStatus] = useState('Testing Firebase connection...')
  const [data, setData] = useState(null)

  useEffect(() => {
    async function test() {
      try {
        const ref = doc(db, 'testCollection', 'testDoc')
        await setDoc(ref, { hello: 'world', timestamp: new Date() })
        const snap = await getDoc(ref)
        const fetchedData = snap.data()
        setData(fetchedData)
        setStatus('✅ Firebase connected successfully!')
        console.log('Firestore data:', fetchedData)
      } catch (error) {
        setStatus('❌ Firebase connection failed: ' + error.message)
        console.error('Firebase error:', error)
      }
    }
    test()
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Firebase Connection Test</h1>
      <p>{status}</p>
      {data && (
        <div>
          <h2>Data from Firestore:</h2>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
