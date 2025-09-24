import { useEffect, useState } from 'react'

export default function EndGameScreen({ players, onBack, user }) {
  const [visibleRanks, setVisibleRanks] = useState([])
  const [showCursor, setShowCursor] = useState(true)
  const [typedText, setTypedText] = useState('')
  const [showStars, setShowStars] = useState(false)
  const [flashingStars, setFlashingStars] = useState([])
  const sortedPlayers = players
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 3)

  useEffect(() => {
    // Show ranks one by one with slower animation from 3rd -> 2nd -> 1st
    const delays = [4000, 2000, 0] // 3rd place first (index 2), then 2nd (index 1), then 1st (index 0) - slower timing

    sortedPlayers.forEach((_, index) => {
      setTimeout(() => {
        setVisibleRanks((prev) => [...prev, index])
      }, delays[index])
    })

    // Show stars after all podiums are visible
    if (sortedPlayers.length > 0) {
      setTimeout(() => {
        setShowStars(true)
        // Initialize flashing stars positions
        const initialStars = Array.from({ length: 8 }, (_, i) => ({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          isFlashing: false,
        }))
        setFlashingStars(initialStars)
      }, 4500) // 500ms after the last podium appears
    }
  }, [sortedPlayers])

  // Handle flashing stars animation
  useEffect(() => {
    if (!showStars || flashingStars.length === 0) return

    const interval = setInterval(() => {
      setFlashingStars((prev) =>
        prev.map((star) => {
          if (Math.random() < 0.01) {
            // Reduced chance to 15% instead of 30%
            // Start flashing and set new position for next cycle
            setTimeout(() => {
              setFlashingStars((current) =>
                current.map((s) =>
                  s.id === star.id
                    ? {
                        ...s,
                        x: Math.random() * 100,
                        y: Math.random() * 100,
                        isFlashing: false,
                      }
                    : s
                )
              )
            }, 3000) // Longer flash duration - 3s instead of 1s

            return { ...star, isFlashing: true }
          }
          return star
        })
      )
    }, 8000) // Much longer interval - 8s instead of 2s

    return () => clearInterval(interval)
  }, [showStars, flashingStars.length])

  const getRankColor = (rank) => {
    if (rank === 0) return '#FFD700' // Gold
    if (rank === 1) return '#C0C0C0' // Silver
    if (rank === 2) return '#CD7F32' // Bronze
    return '#fff'
  }

  const fullText = 'Top 3 lịch sử gia xuất sắc nhất'
  useEffect(() => {
    let index = 0
    const typingInterval = setInterval(() => {
      if (index < fullText.length) {
        setTypedText(fullText.slice(0, index + 1))
        index++
      } else {
        clearInterval(typingInterval)
      }
    }, 50) // Tốc độ typing: 50ms mỗi ký tự

    // Cursor blinking
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 500)

    return () => {
      clearInterval(typingInterval)
      clearInterval(cursorInterval)
    }
  }, [])

  return (
    <div
      style={{
        height: '100vh',
        boxSizing: 'border-box',
        width: '100vw',
        background: `url('src/assets/background/home.png') center bottom / cover no-repeat`,
        fit: 'cover',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Overlay layer để làm nổi content */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(0.5px)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      <h1
        style={{
          fontSize: 48,
          fontWeight: 'bold',
          marginBottom: 20,
          textShadow: '2px 2px 4px rgba(255, 255, 255, 0.3)',
          color: '#983a34',
          fontFamily: "'Ms Madi', cursive",
          zIndex: 2,
        }}
      >
        Kết quả chặng Du hành thời gian
      </h1>
      <div
        style={{
          fontSize: 18,
          color: '#2a2a2aff',
          pointerEvents: 'auto',
          fontFamily: 'monospace',
          margin: '10px auto 0',
          letterSpacing: '0.1em',
          lineHeight: '1.8',
          zIndex: 2,
          maxWidth: '100%',
          minHeight: '60px', // Để đảm bảo không bị nhảy layout
        }}
      >
        {typedText}
        <span
          style={{
            opacity: showCursor ? 1 : 0,
            transition: 'opacity 0.1s',
            color: '#2a2a2aff',
          }}
        >
          |
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'end',
          gap: 20,
          marginBottom: 40,
        }}
      >
        {/* 2nd Place */}
        {sortedPlayers[1] && (
          <div
            style={{
              opacity: visibleRanks.includes(1) ? 1 : 0,
              transform: visibleRanks.includes(1)
                ? 'translateY(0) scale(1)'
                : 'translateY(50px) scale(0.8)',
              transition: 'all 0.8s ease-out',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                overflow: 'hidden',
                marginBottom: 10,
                border: '4px solid #C0C0C0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              <img
                src={sortedPlayers[1].avatar}
                alt='Avatar'
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>

            <div
              style={{
                fontSize: 64,
                marginBottom: 10,
              }}
            >
              🥈
            </div>
            <div
              style={{
                background: getRankColor(1),
                color: '#000',
                padding: '20px',
                borderRadius: '10px',
                minWidth: 150,
                height: 120,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
              }}
            >
              <div
                style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 5 }}
              >
                {sortedPlayers[1].nickname}
                {sortedPlayers[1].nickname === user?.nickname && ' 👤'}
              </div>
              <div style={{ fontSize: 18 }}>{sortedPlayers[1].score} pts</div>
            </div>
          </div>
        )}

        {/* 1st Place (tallest) */}
        {sortedPlayers[0] && (
          <div
            style={{
              opacity: visibleRanks.includes(0) ? 1 : 0,
              transform: visibleRanks.includes(0)
                ? 'translateY(0) scale(1)'
                : 'translateY(50px) scale(0.8)',
              transition: 'all 0.8s ease-out',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                overflow: 'hidden',
                marginBottom: 10,
                border: '5px solid #FFD700',
                boxShadow: '0 6px 16px rgba(255,215,0,0.4)',
              }}
            >
              <img
                src={sortedPlayers[0].avatar}
                alt='Avatar'
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>

            <div
              style={{
                fontSize: 80,
                marginBottom: 10,
              }}
            >
              🥇
            </div>
            <div
              style={{
                background: getRankColor(0),
                color: '#000',
                padding: '25px',
                borderRadius: '10px',
                minWidth: 160,
                height: 140,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                boxShadow: '0 12px 24px rgba(0,0,0,0.4)',
                border: '3px solid #fff',
              }}
            >
              <div
                style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 8 }}
              >
                {sortedPlayers[0].nickname}
                {sortedPlayers[0].nickname === user?.nickname && ' 👤'}
              </div>
              <div style={{ fontSize: 20 }}>{sortedPlayers[0].score} pts</div>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {sortedPlayers[2] && (
          <div
            style={{
              opacity: visibleRanks.includes(2) ? 1 : 0,
              transform: visibleRanks.includes(2)
                ? 'translateY(0) scale(1)'
                : 'translateY(50px) scale(0.8)',
              transition: 'all 0.8s ease-out',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 70,
                height: 70,
                borderRadius: '50%',
                overflow: 'hidden',
                marginBottom: 10,
                border: '3px solid #CD7F32',
                boxShadow: '0 3px 10px rgba(0,0,0,0.3)',
              }}
            >
              <img
                src={sortedPlayers[2].avatar}
                alt='Avatar'
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>

            <div
              style={{
                fontSize: 56,
                marginBottom: 10,
              }}
            >
              🥉
            </div>
            <div
              style={{
                background: getRankColor(2),
                color: '#000',
                padding: '15px',
                borderRadius: '10px',
                minWidth: 140,
                height: 100,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                boxShadow: '0 6px 12px rgba(0,0,0,0.3)',
              }}
            >
              <div
                style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 5 }}
              >
                {sortedPlayers[2].nickname}
                {sortedPlayers[2].nickname === user?.nickname && ' 👤'}
              </div>
              <div style={{ fontSize: 16 }}>{sortedPlayers[2].score} pts</div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onBack}
        style={{
          padding: '15px 30px',
          fontSize: 18,
          fontWeight: 'bold',
          border: '1px solid #ccc',
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
          marginBottom: 20,
          color: '#983a34',
          borderRadius: '25px',
          cursor: 'pointer',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          transition: 'all 0.3s ease',
        }}
        onMouseOver={(e) => {
          e.target.style.transform = 'scale(1.05)'
          e.target.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)'
        }}
        onMouseOut={(e) => {
          e.target.style.transform = 'scale(1)'
          e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)'
        }}
      >
        Back to Home
      </button>

      {/* Starry Sky Animation */}
      {showStars && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1000,
          }}
        >
          {[...Array(100)].map((_, i) => {
            const size = Math.random() * 3 + 1 // Star size between 1-4px
            const twinkleDelay = Math.random() * 6 // Longer delay range

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  background: [
                    '#FFD700',
                    '#FFFFFF',
                    '#87CEEB',
                    '#FFA500',
                    '#FFB6C1',
                  ][Math.floor(Math.random() * 5)],
                  borderRadius: '50%',
                  animationDelay: `${twinkleDelay}s`,
                  animation: 'twinkle 4s ease-in-out infinite', // Slower - 4s instead of 2s
                  boxShadow: `0 0 ${size * 2}px ${
                    ['#FFD700', '#FFFFFF', '#87CEEB', '#FFA500', '#FFB6C1'][
                      Math.floor(Math.random() * 5)
                    ]
                  }`,
                }}
              />
            )
          })}

          {/* Flashing stars */}
          {flashingStars.map((star) => (
            <div
              key={`flashing-${star.id}`}
              style={{
                position: 'absolute',
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: '6px',
                height: '6px',
                background: '#FFD700',
                borderRadius: '50%',
                opacity: star.isFlashing ? 1 : 0,
                transform: star.isFlashing ? 'scale(2)' : 'scale(0.5)',
                transition: 'all 7s ease-in-out', // Slower transition - 3s instead of 1.2s
                animation: star.isFlashing
                  ? 'flash-star 7s ease-in-out'
                  : 'none', // Longer animation - 7s
                boxShadow: star.isFlashing
                  ? '0 0 20px #FFD700, 0 0 40px #FFD700'
                  : '0 0 5px #FFD700',
              }}
            />
          ))}
        </div>
      )}

      <style>
        {`
          @keyframes twinkle {
            0%, 100% { 
              opacity: 0.3;
              transform: scale(1);
            }
            50% { 
              opacity: 1;
              transform: scale(1.5);
            }
          }
          
          @keyframes flash-star {
            0% {
              opacity: 0;
              transform: scale(0.5);
              box-shadow: 0 0 5px #FFD700;
            }
            50% {
              opacity: 1;
              transform: scale(3);
              box-shadow: 0 0 30px #FFD700, 0 0 60px #FFD700, 0 0 90px #FFD700;
            }
            100% {
              opacity: 0;
              transform: scale(0.5);
              box-shadow: 0 0 5px #FFD700;
            }
          }
        `}
      </style>
    </div>
  )
}
