import { useEffect, useRef, useState } from 'react'
import { db } from './firebase/config'
import { collection, onSnapshot } from 'firebase/firestore'

export default function ResultScreen({
  question,
  selectedAnswer,
  players: initialPlayers,
  user,
  onBack,
}) {
  // Ensure both values are numbers for comparison (same as PlayingScreen)
  const correctIndex = parseInt(question.correctIndex)
  const selectedIndex = parseInt(selectedAnswer)
  const isCorrect = selectedIndex === correctIndex

  // State for real-time players data
  const [players, setPlayers] = useState(initialPlayers || [])
  const [syncingPlayers, setSyncingPlayers] = useState(false)

  // Real-time sync with Firebase for players data
  useEffect(() => {
    // We need gameId to sync players - get it from user object
    if (!user?.gameId) {
      // If no gameId, just use initial players
      setPlayers(initialPlayers || [])
      return
    }

    setSyncingPlayers(true)
    console.log('Setting up real-time sync for game:', user.gameId)
    const unsub = onSnapshot(
      collection(db, 'games', user.gameId, 'players'),
      (snap) => {
        const updatedPlayers = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        console.log('Real-time players update:', updatedPlayers)
        setPlayers(updatedPlayers)
        setSyncingPlayers(false)
      },
      (error) => {
        console.error('Error syncing players:', error)
        // Fallback to initial players if sync fails
        setPlayers(initialPlayers || [])
        setSyncingPlayers(false)
      }
    )

    return () => unsub()
  }, [user?.gameId, initialPlayers])

  const sortedPlayers = players.sort((a, b) => (b.score || 0) - (a.score || 0))

  // Calculate ranks with proper tie handling
  const playersWithRank = []
  let currentRank = 1

  sortedPlayers.forEach((player, index) => {
    if (index > 0) {
      const currentScore = player.score || 0
      const previousScore = sortedPlayers[index - 1].score || 0
      if (currentScore !== previousScore) {
        currentRank = index + 1
      }
      // If scores are equal, currentRank stays the same
    }
    playersWithRank.push({ ...player, rank: currentRank })
  })

  // Get current user's rank for scrolling
  const currentUserRank =
    playersWithRank.find((p) => p.nickname === user?.nickname)?.rank || 1

  // Avatar helper function
  const getAvatarImage = (nickname) => {
    const avatarFiles = [
      '0807ac9f-7b9c-43bbe50a82e08.png',
      '0ba46bc7-b81b-44f2cbff.png',
      '1c87f596dbbaaebf059259272e46.png',
      '2e7c9dc183e550431672a6911739.png',
      '6f0439fa-c2e4-481e-80-b73f27ead2.png',
      '872dc38f-b629-477f-90ed-59ef5f02b.png',
      '9565b9ab1d005c5f9aef0e4eb.png',
      'b563bd2b-cedc7a-b343-c9854ad31a46.png',
      'c1f64e87-8afb-47fa-b5c9-ce4bce69e.png',
    ]

    // Ensure nickname is a string and not empty
    if (!nickname || typeof nickname !== 'string') {
      return `src/assets/avatar/${avatarFiles[0]}`
    }

    // Create a more stable hash
    let hash = 0
    for (let i = 0; i < nickname.length; i++) {
      const char = nickname.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }

    // Use absolute value and modulo to get index
    const index = Math.abs(hash) % avatarFiles.length
    return `src/assets/avatar/${avatarFiles[index]}`
  }

  const leaderboardRef = useRef(null)

  // Auto scroll to current user position
  useEffect(() => {
    if (leaderboardRef.current && currentUserRank > 3) {
      const userElement = leaderboardRef.current.querySelector(
        `[data-rank="${currentUserRank}"]`
      )
      if (userElement) {
        userElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    }
  }, [currentUserRank])

  return (
    <div
      style={{
        height: '100vh',
        boxSizing: 'border-box',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        background:
          'url("src/assets/background/home.png") center bottom / cover no-repeat',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        paddingBottom: 20,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(0.5px)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* Back Button - Top Left */}
      <button
        onClick={onBack}
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 3,
          background: 'rgba(255, 255, 255, 0.25)',
          border: '1px solid #ccc',
          borderRadius: 25,
          padding: '10px 15px',
          color: '#983a34',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.4)'
          e.target.style.transform = 'scale(1.05)'
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.25)'
          e.target.style.transform = 'scale(1)'
        }}
      >
        ← Home
      </button>

      <div
        style={{
          height: '20%',
          padding: 20,
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ fontSize: 24, marginTop: 20 }}>
          Đáp án của bạn: {isCorrect ? '✅ Đúng' : '❌ Sai'}
        </div>
      </div>
      <div
        style={{
          zIndex: 2,
          marginBottom: 20,
          height: '80%',
          width: '70%',
          padding: '20px 40px',
          borderRadius: 20,
          border: '1px solid #ccc',
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Fixed Header */}
        <h3 style={{ marginBottom: 20, margin: 0, paddingBottom: 20 }}>
          Leaderboard {syncingPlayers && '🔄'}
        </h3>

        {/* Scrollable List */}
        <div
          ref={leaderboardRef}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            overflowY: 'auto',
            flex: 1,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          className='hide-scrollbar'
        >
          <style jsx>{`
            .hide-scrollbar::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {playersWithRank.map((p) => {
            const maxScore = Math.max(
              ...playersWithRank.map((player) => player.score || 0)
            )
            const scorePercentage =
              maxScore > 0 ? ((p.score || 0) / maxScore) * 100 : 0
            const isCurrentUser = p.nickname === user?.nickname

            return (
              <div
                key={p.nickname}
                data-rank={p.rank}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: 12,
                  backgroundColor: isCurrentUser
                    ? 'rgba(76, 175, 80, 0.8)'
                    : 'rgba(0, 0, 0, 0.7)',
                  border: isCurrentUser
                    ? '2px solid #4CAF50'
                    : '1px solid rgba(255, 255, 255, 0.2)',
                  minHeight: 60,
                  position: 'relative',
                  overflow: 'hidden',
                  width: '100%', // Ensure full width
                  boxSizing: 'border-box', // Include padding/border in width
                }}
              >
                {/* Progress bar background */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    height: '100%',
                    width: `${scorePercentage}%`,
                    background: isCurrentUser
                      ? 'linear-gradient(90deg, rgba(76, 175, 80, 0.3) 0%, rgba(139, 195, 74, 0.3) 100%)'
                      : 'linear-gradient(90deg, rgba(33, 150, 243, 0.3) 0%, rgba(3, 169, 244, 0.3) 100%)',
                    transition: 'width 1s ease-out',
                    zIndex: 1,
                  }}
                />

                {/* Rank number */}
                <div
                  style={{
                    minWidth: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor:
                      p.rank <= 3
                        ? p.rank === 1
                          ? '#FFD700'
                          : p.rank === 2
                          ? '#C0C0C0'
                          : '#CD7F32'
                        : 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: 16,
                    color: p.rank <= 3 ? '#000' : '#fff',
                    marginRight: 12,
                    zIndex: 2,
                    position: 'relative',
                  }}
                >
                  {p.rank}
                </div>

                {/* Avatar */}
                <div
                  style={{
                    width: 35,
                    height: 35,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    marginRight: 12,
                    zIndex: 2,
                    position: 'relative',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    flexShrink: 0, // Prevent avatar from shrinking
                  }}
                >
                  <img
                    src={p.avatar || getAvatarImage(p.nickname)}
                    alt={`${p.nickname} avatar`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      // Fallback to first avatar if image fails to load
                      e.target.src =
                        'src/assets/avatar/0807ac9f-7b9c-43bbe50a82e08.png'
                    }}
                  />
                </div>

                {/* Player info */}
                <div
                  style={{
                    flex: 1,
                    zIndex: 2,
                    position: 'relative',
                    textAlign: 'left', // Align text to left for better readability
                    minWidth: 0, // Allow flex item to shrink
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: isCurrentUser ? 'bold' : 'normal',
                      color: '#fff',
                      marginBottom: 2,
                      whiteSpace: 'nowrap', // Prevent text wrapping
                      overflow: 'hidden',
                      textOverflow: 'ellipsis', // Add ellipsis for long names
                    }}
                  >
                    {p.nickname} {isCurrentUser && '⭐'}
                  </div>
                </div>

                {/* Score percentage */}
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: '#fff',
                    zIndex: 2,
                    position: 'relative',
                  }}
                >
                  {p.score}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
