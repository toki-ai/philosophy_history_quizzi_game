import { useEffect, useState } from 'react'
import { db } from './firebase/config'
import {
  doc,
  onSnapshot,
  updateDoc,
  collection,
  getDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore'

export default function RoomDetail({ roomId, onBack }) {
  const [room, setRoom] = useState(null)
  const [players, setPlayers] = useState([])
  const [timeLeft, setTimeLeft] = useState(60)
  const [timerActive, setTimerActive] = useState(false)

  // Subscribe to room info and start timer when question starts
  useEffect(() => {
    if (!roomId) return
    const unsub = onSnapshot(doc(db, 'games', roomId), (snap) => {
      const data = { id: snap.id, ...snap.data() }
      setRoom(data)

      // Start countdown when question starts playing
      if (data.questionStarted === 'playing' && !timerActive) {
        setTimeLeft(60)
        setTimerActive(true)
      } else if (data.questionStarted !== 'playing') {
        setTimerActive(false)
      }
    })
    return () => unsub()
  }, [roomId, timerActive])

  // Countdown timer effect
  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return

    const timer = setInterval(async () => {
      setTimeLeft((prev) => {
        const newTime = prev - 1

        // Auto end question when time is up
        if (newTime <= 0) {
          setTimerActive(false)
          updateDoc(doc(db, 'games', roomId), { questionStarted: 'result' })
          return 0
        }

        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timerActive, timeLeft, roomId])

  // Subscribe to players
  useEffect(() => {
    if (!roomId) return
    const unsub = onSnapshot(
      collection(db, 'games', roomId, 'players'),
      (snap) => {
        setPlayers(snap.docs.map((d) => d.data()))
      }
    )
    return () => unsub()
  }, [roomId])

  const handleAdminAction = async (action) => {
    if (!room) return
    const ref = doc(db, 'games', roomId)
    if (action === 'start')
      await updateDoc(ref, {
        currentQ: room.currentQ || 1,
        status: 'in-progress',
        questionStarted: 'playing',
        submittedCount: 0,
      })
    if (action === 'end') await updateDoc(ref, { questionStarted: 'result' })
    if (action === 'learn') await updateDoc(ref, { questionStarted: 'learn' })
    if (action === 'endgame')
      await updateDoc(ref, { questionStarted: 'endgame', status: 'ended' })
    if (action === 'next') {
      // Check if this is the last question of the level
      const levelQuestions = await getDocs(
        query(
          collection(db, 'questions'),
          where('level', '==', room.level || 1)
        )
      )
      const maxOrder =
        levelQuestions.docs.length > 0
          ? Math.max(...levelQuestions.docs.map((d) => d.data().order || 1))
          : 1
      const nextQ = (room.currentQ || 1) + 1
      if (nextQ > maxOrder) {
        // Last question of current level
        const currentLevel = room.level || 1
        if (currentLevel >= 4) {
          // Last question of final level (Level 4), end game
          await updateDoc(ref, {
            questionStarted: 'endgame',
            status: 'ended',
          })
        } else {
          // Advance to next level
          const newLevel = currentLevel + 1
          await updateDoc(ref, {
            level: newLevel,
            currentQ: 1,
            questionStarted: 'home',
            submittedCount: 0,
          })
          // Update players' level in users collection
          for (const player of players) {
            if (player.role === 'user') {
              const userRef = doc(db, 'users', player.nickname)
              const userSnap = await getDoc(userRef)
              if (userSnap.exists()) {
                const userData = userSnap.data()
                const updatedLevel = Math.max(userData.level || 1, newLevel)
                await updateDoc(userRef, { level: updatedLevel })
              }
            }
          }
        }
      } else {
        // Next question in same level
        await updateDoc(ref, {
          currentQ: nextQ,
          submittedCount: 0,
        })
      }
    }
    if (action === 'reset') {
      // Reset game to level 1, question 1 and send users back to home screen
      await updateDoc(ref, {
        level: 1,
        currentQ: 1,
        questionStarted: 'home',
        submittedCount: 0,
        status: 'waiting',
      })
      // Reset all users' level to 1
      for (const player of players) {
        if (player.role === 'user') {
          const userRef = doc(db, 'users', player.nickname)
          const userSnap = await getDoc(userRef)
          if (userSnap.exists()) {
            await updateDoc(userRef, { level: 1 })
          }
        }
      }
    }
  }

  if (!room) return <div>Loading...</div>

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <button
        onClick={onBack}
        style={{
          marginBottom: 24,
          background: '#eee',
          border: 'none',
          borderRadius: 5,
          padding: '6px 14px',
          cursor: 'pointer',
        }}
      >
        ← Back
      </button>
      {/* Top section: room info */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700 }}>
          Room Code: {room.code}
        </div>
        <div>
          Status: <b>{room.status}</b>
        </div>
        <div>
          Current Q: <b>{room.currentQ ?? '-'}</b>
        </div>
        <div>
          Level: <b>{room.level ?? '-'}</b>
        </div>
        <div>
          Submitted:{' '}
          <b>
            {room.submittedCount ?? 0}/
            {players.filter((p) => p.role === 'user').length}
          </b>
        </div>
        {room?.questionStarted === 'playing' && (
          <div
            style={{
              background: timeLeft <= 10 ? '#ff4444' : '#44aa44',
              color: 'white',
              padding: '8px 16px',
              borderRadius: 8,
              fontWeight: 'bold',
            }}
          >
            Time: {timeLeft}s
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 32 }}>
        {/* Left: Players */}
        <div
          style={{
            flex: 1,
            background: '#232323',
            borderRadius: 10,
            padding: 18,
            minWidth: 220,
          }}
        >
          <h3 style={{ marginTop: 0, color: '#fff' }}>Players</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {players.length === 0 ? (
              <li>No players yet.</li>
            ) : (
              players.map((p, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                    padding: 8,
                    background: '#444',
                    borderRadius: 5,
                  }}
                >
                  <span>
                    {p.nickname} {p.role === 'admin' && '���'}
                  </span>
                  <span>Score: {p.score || 0}</span>
                </li>
              ))
            )}
          </ul>
        </div>
        {/* Right: Admin Controls */}
        <div
          style={{
            flex: 1,
            background: '#232323',
            borderRadius: 10,
            padding: 18,
            color: '#fff',
          }}
        >
          <h3 style={{ marginTop: 0 }}>Admin Controls</h3>
          <button
            onClick={() => handleAdminAction('start')}
            style={{
              width: '100%',
              marginBottom: 12,
              background: '#28a745',
              color: '#fff',
              border: 'none',
              borderRadius: 5,
              padding: '10px 0',
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            Start Question
          </button>
          <button
            onClick={() => handleAdminAction('end')}
            style={{
              width: '100%',
              marginBottom: 12,
              background: '#ffc107',
              color: '#000',
              border: 'none',
              borderRadius: 5,
              padding: '10px 0',
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            End Question
          </button>
          {room?.questionStarted === 'result' && (
            <button
              onClick={() => handleAdminAction('learn')}
              style={{
                width: '100%',
                marginBottom: 12,
                background: '#17a2b8',
                color: '#fff',
                border: 'none',
                borderRadius: 5,
                padding: '10px 0',
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              Show Learning Slide
            </button>
          )}
          <button
            onClick={() => handleAdminAction('reset')}
            style={{
              width: '100%',
              marginBottom: 12,
              background: '#fd7e14',
              color: '#fff',
              border: 'none',
              borderRadius: 5,
              padding: '10px 0',
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            Reset Game
          </button>
          <button
            onClick={() => handleAdminAction('next')}
            style={{
              width: '100%',
              marginBottom: 12,
              background: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: 5,
              padding: '10px 0',
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            Next Question
          </button>
          <button
            onClick={() => handleAdminAction('endgame')}
            style={{
              width: '100%',
              background: '#dc3545',
              color: '#fff',
              border: 'none',
              borderRadius: 5,
              padding: '10px 0',
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            End Game
          </button>
        </div>
      </div>
    </div>
  )
}
