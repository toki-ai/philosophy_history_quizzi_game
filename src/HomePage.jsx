import { useState, useEffect } from 'react'
import { db } from './firebase/config'
import { doc, onSnapshot } from 'firebase/firestore'
import HomeScreen from './HomeScreen'
import AdminDashboard from './AdminDashboard'
import PlayerView from './PlayerView'

export default function HomePage({ user, onLogout }) {
  // Initialize isPlaying from localStorage first, then check current game state
  const [isPlaying, setIsPlaying] = useState(() => {
    if (user?.role === 'admin') return false
    const savedGameState = localStorage.getItem(`gameState_${user?.gameId}`)
    return savedGameState ? JSON.parse(savedGameState).isPlaying : false
  })
  const [userLevel, setUserLevel] = useState(1)

  console.log(
    'HomePage render - user.level:',
    user?.level,
    'userLevel state:',
    userLevel
  )

  // Initialize userLevel from user prop
  useEffect(() => {
    if (user?.level) {
      console.log('Syncing userLevel from user prop:', user.level)
      setUserLevel(user.level)
    }
  }, [user?.level])

  // Subscribe to user level updates
  useEffect(() => {
    if (!user?.nickname || user?.role === 'admin') return

    console.log('Subscribing to user:', user.nickname)
    const unsub = onSnapshot(doc(db, 'users', user.nickname), (snap) => {
      if (snap.exists()) {
        const userData = snap.data()
        console.log('User data from Firestore:', userData)
        const newLevel = userData.level || 1
        console.log('Setting userLevel to:', newLevel)
        setUserLevel(newLevel)
        // Update localStorage
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
        const updatedUser = { ...currentUser, level: newLevel }
        localStorage.setItem('user', JSON.stringify(updatedUser))
      } else {
        console.log('User document does not exist')
      }
    })

    return () => unsub()
  }, [user?.nickname, user?.role])

  // Check game state immediately on mount for non-admin users
  useEffect(() => {
    if (!user?.gameId || user?.role === 'admin') return

    // Check current game state to see if user should be in PlayerView
    const checkGameState = async () => {
      try {
        console.log('Checking game state on mount for gameId:', user.gameId)
        // This will be handled by the subscription effect below, but we set this up
        // to ensure proper initialization
      } catch (error) {
        console.error('Error checking game state:', error)
      }
    }

    checkGameState()
  }, [user?.gameId, user?.role])

  // Subscribe to game status for auto-switching to PlayerView
  useEffect(() => {
    if (!user?.gameId || user?.role === 'admin') return

    console.log('Subscribing to game:', user.gameId)
    const unsub = onSnapshot(doc(db, 'games', user.gameId), (snap) => {
      if (snap.exists()) {
        const gameData = snap.data()
        const questionStarted = gameData.questionStarted
        console.log('Game data:', gameData)

        // Also update user level from game level if higher
        if (gameData.level) {
          console.log('Updating user level from game:', gameData.level)
          setUserLevel((currentLevel) => Math.max(currentLevel, gameData.level))
        }

        if (
          questionStarted === 'playing' ||
          questionStarted === 'result' ||
          questionStarted === 'endgame'
        ) {
          setIsPlaying(true)
          // Save game state to localStorage
          localStorage.setItem(
            `gameState_${user.gameId}`,
            JSON.stringify({
              isPlaying: true,
              questionStarted,
            })
          )
        } else if (questionStarted === 'home') {
          setIsPlaying(false)
          // Clear game state from localStorage
          localStorage.removeItem(`gameState_${user.gameId}`)
        }
      }
    })

    return () => unsub()
  }, [user?.gameId, user?.role])

  if (user?.role === 'admin') {
    return <AdminDashboard adminId={user.nickname} />
  }
  if (isPlaying) {
    return (
      <PlayerView
        gameId={user.gameId || 'game1'}
        user={user}
        onBack={() => {
          setIsPlaying(false)
          // Clear game state when manually going back
          localStorage.removeItem(`gameState_${user.gameId}`)
        }}
      />
    )
  }
  return (
    <div>
      <HomeScreen user={user} currentLevel={userLevel} onLogout={onLogout} />
    </div>
  )
}
