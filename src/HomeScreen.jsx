import { useState, useEffect } from 'react'
import { MdLogout } from 'react-icons/md'
import { db } from './firebase/config'
import { collection, onSnapshot } from 'firebase/firestore'

const LEVELS = [
  { icon: '🏛️', title: 'Chương 1: Thế giới của Ý niệm' },
  { icon: '⛪', title: 'Chương 2: Vùng đất Nghi ngờ' },
  { icon: '📚', title: 'Chương 3: Ánh sáng Biện chứng' },
  { icon: '⚙️', title: 'Chương 4: Mê cung Thông tin' },
]

export default function HomeScreen({ user, onLogout, currentLevel }) {
  const [userList, setUserList] = useState([])
  const score = user?.score ?? 0
  const [typedText, setTypedText] = useState('')
  const [showCursor, setShowCursor] = useState(true)

  const fullText =
    'Bạn là một nhà lịch sử gia trẻ tuổi vừa bước vào hành trình vượt thời gian kỳ thú. Mỗi màn chơi sẽ mở ra bức tranh sống động với nhân vật, bối cảnh, và câu hỏi đang chờ bạn khám phá.'

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

  // Load user list from the same game
  useEffect(() => {
    if (!user?.gameId) {
      // If no gameId (like for admin users), try to load all users from the users collection
      if (user?.role === 'admin') {
        console.log('Loading all users for admin view')
        const unsub = onSnapshot(
          collection(db, 'users'),
          (snap) => {
            const allUsers = snap.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            // Filter to only show regular users (not admin)
            const regularUsers = allUsers.filter(
              (userData) => userData.role === 'user'
            )
            setUserList(regularUsers)
            console.log('Loaded all users for admin:', regularUsers)
          },
          (error) => {
            console.error('Error loading all users:', error)
          }
        )
        return () => unsub()
      }
      return
    }

    console.log('Loading user list from game:', user.gameId)
    const unsub = onSnapshot(
      collection(db, 'games', user.gameId, 'players'),
      (snap) => {
        const players = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        // Filter to only show regular users (not admin)
        const regularUsers = players.filter((player) => player.role === 'user')
        setUserList(regularUsers)
        console.log('Loaded users from game:', regularUsers)
      },
      (error) => {
        console.error('Error loading user list:', error)
      }
    )

    return () => unsub()
  }, [user?.gameId, user?.role])

  console.log('HomeScreen render - currentLevel:', currentLevel)

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background:
          'url("/assets/background/home.png") center bottom / cover no-repeat',
        color: '#983a34',
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
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* Content wrapper với z-index cao hơn */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          height: '100%',
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            padding: '24px 32px 0 32px',
          }}
        >
          {/* Top-left: User info */}
          <div style={{ textAlign: 'left' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,

                paddingLeft: 20,
                paddingRight: 20,
                borderRadius: 50,
                border: '1px solid #ccc',
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
              }}
            >
              <div>
                <img
                  src={
                    user?.avatar || '/assets/avatar/0ba46bc7-b81b-44f2cbff.png'
                  }
                  alt='Selected avatar'
                  style={{
                    width: 80,
                    objectFit: 'cover',
                  }}
                />
              </div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: 18 }}>
                  {user?.nickname || 'Unknown Player'}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontStyle: 'italic',
                  }}
                >
                  Điểm số: {score ?? 0}
                </div>
              </div>
            </div>
          </div>

          {/* Top-center: Title & desc */}
          <div
            style={{
              position: 'absolute',
              top: 32,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '50%',
              textAlign: 'center',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 32,
                fontWeight: 700,
                letterSpacing: 1,
                pointerEvents: 'auto',
                fontFamily: "'Ms Madi', cursive",
              }}
            >
              Dòng Thời Gian
            </h1>
            <div
              style={{
                fontSize: 14,
                color: '#983a34',
                marginTop: 10,
                pointerEvents: 'auto',
                fontFamily: 'monospace',
                margin: '10px auto 0',
                letterSpacing: '0.1em',
                lineHeight: '1.4',
                maxWidth: '100%',
                minHeight: '60px', // Để đảm bảo không bị nhảy layout
              }}
            >
              {typedText}
              <span
                style={{
                  opacity: showCursor ? 1 : 0,
                  transition: 'opacity 0.1s',
                  color: '#983a34',
                }}
              >
                |
              </span>
            </div>
          </div>
          <div
            style={{
              position: 'absolute',
              top: '20%',
              left: 10,
              width: '20%',
              textAlign: 'center',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          ></div>

          {/* Top-right: Sound toggle & logout */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 10,
            }}
          >
            <button
              onClick={onLogout}
              style={{
                marginTop: 8,
                padding: '6px 18px',
                background: 'transparent',
                color: '#983a34',
                border: 'none',
                borderRadius: 5,
                fontWeight: 500,
                cursor: 'pointer',
                fontSize: 15,
              }}
            >
              <MdLogout size={22} />
            </button>
          </div>
        </div>

        {/* Levels map */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: 60,
            position: 'relative',
            maxWidth: '70%',
            margin: '0px auto 0',
          }}
        >
          {/* CSS cho floating animation */}
          <style>
            {`
              @keyframes floatOnWater {
                0% { transform: translate(-50%, -50%) translateY(0px) rotate(0deg); }
                25% { transform: translate(-50%, -50%) translateY(-3px) rotate(0.5deg); }
                50% { transform: translate(-50%, -50%) translateY(-1px) rotate(0deg); }
                75% { transform: translate(-50%, -50%) translateY(-4px) rotate(-0.5deg); }
                100% { transform: translate(-50%, -50%) translateY(0px) rotate(0deg); }
              }
              
              @keyframes floatOnWater2 {
                0% { transform: translate(-50%, -50%) translateY(0px) rotate(0deg); }
                30% { transform: translate(-50%, -50%) translateY(-2px) rotate(-0.3deg); }
                60% { transform: translate(-50%, -50%) translateY(-5px) rotate(0.3deg); }
                90% { transform: translate(-50%, -50%) translateY(-1px) rotate(-0.2deg); }
                100% { transform: translate(-50%, -50%) translateY(0px) rotate(0deg); }
              }
              
              @keyframes floatOnWater3 {
                0% { transform: translate(-50%, -50%) translateY(0px) rotate(0deg); }
                20% { transform: translate(-50%, -50%) translateY(-4px) rotate(0.4deg); }
                45% { transform: translate(-50%, -50%) translateY(-1px) rotate(-0.3deg); }
                70% { transform: translate(-50%, -50%) translateY(-3px) rotate(0.2deg); }
                100% { transform: translate(-50%, -50%) translateY(0px) rotate(0deg); }
              }
            `}
          </style>

          {/* Level nodes */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              width: '100%',
              height: '280px',
            }}
          >
            {LEVELS.map((level, idx) => {
              const levelNumber = idx + 1
              const isCompleted = levelNumber < currentLevel
              const isCurrentLevel = levelNumber === currentLevel
              const isLocked = levelNumber > currentLevel

              // Position levels along the curved path
              const positions = [
                { left: '8%', top: '35%' },
                { left: '30%', top: '65%' },
                { left: '55%', top: '40%' },
                { left: '80%', top: '60%' },
              ]

              const position = positions[idx]

              // Chọn animation khác nhau cho mỗi level
              const animations = [
                'floatOnWater 4s ease-in-out infinite',
                'floatOnWater2 5s ease-in-out infinite 0.5s',
                'floatOnWater3 4.5s ease-in-out infinite 1s',
                'floatOnWater 5.5s ease-in-out infinite 1.5s',
              ]

              return (
                <div
                  key={level.title}
                  style={{
                    position: 'absolute',
                    left: position.left,
                    top: position.top,
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    animation: animations[idx],
                  }}
                >
                  {/* Level circle */}
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background:
                        isCompleted || isCurrentLevel
                          ? 'linear-gradient(145deg, #f5f5f5, #ffffff)'
                          : 'linear-gradient(145deg, #8B4513, #A0522D)',
                      boxShadow:
                        isCompleted || isCurrentLevel
                          ? 'inset -4px -4px 8px rgba(139, 69, 19, 0.3), inset 4px 4px 8px rgba(255, 255, 255, 0.7), 0 8px 16px rgba(0,0,0,0.2)'
                          : '0 4px 12px rgba(0,0,0,0.3), inset -2px -2px 4px rgba(0,0,0,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      opacity: isLocked ? 1 : 1,
                      transition: 'all 0.3s ease',
                      position: 'relative',
                    }}
                  >
                    {/* Level number */}
                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 'bold',
                        color:
                          isCompleted || isCurrentLevel
                            ? '#8B4513'
                            : '#cacacaff',
                        textShadow:
                          isCompleted || isCurrentLevel
                            ? '1px 1px 2px rgba(139, 69, 19, 0.3)'
                            : '1px 1px 2px rgba(0,0,0,0.5)',
                      }}
                    >
                      {levelNumber}
                    </div>
                  </div>

                  {/* Level title */}
                  <div
                    style={{
                      marginTop: 12,
                      fontSize: isCurrentLevel || isCompleted ? 12 : 14,
                      fontWeight: 'bold',
                      textAlign: 'center',
                      color: isCurrentLevel ? '#fce91aff' : '#ffffffff',
                      textShadow: '1px 1px 2px rgba(81, 81, 81, 0.5)',
                      maxWidth: 120,
                      lineHeight: 1.2,
                      textTransform: 'uppercase',
                    }}
                  >
                    {isCurrentLevel || isCompleted
                      ? level.title.replace('Level ' + levelNumber + ': ', '')
                      : '🔒'}
                  </div>

                  {/* Status indicator */}
                  {isCurrentLevel && (
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 16,
                      }}
                    >
                      ⭐
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        {/* User list block */}
        <div
          style={{
            maxWidth: '100%',
            margin: '0px 40px 0px 40px',
            border: '1px solid #ccc',
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            borderRadius: 50,
            padding: 24,
            color: '#fff',
            boxShadow: '0 2px 12px #0004',
            minHeight: 'calc(100vh - 460px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {currentLevel === 1 ? (
            // Level 1: Show members list
            <>
              <h2
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 600,
                  textAlign: 'center',
                  color: '#983a34',
                }}
              >
                Thành viên: {userList.length}
              </h2>
              <div
                style={{
                  margin: '18px 0 0 0',
                  fontSize: 16,
                  color: '#ccc',
                  textAlign: 'center',
                }}
              >
                Tổng số: <b>{userList.length}</b> người chơi
              </div>
              <div
                style={{
                  marginTop: 18,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 12,
                  justifyContent: 'center',
                  flex: 1,
                  alignItems: 'flex-start',
                  alignContent: 'flex-start',
                }}
              >
                {userList.length === 0 ? (
                  <span>Chưa có người chơi nào.</span>
                ) : (
                  userList.map((u, idx) => (
                    <div
                      key={u.id || idx}
                      style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        borderRadius: 12,
                        padding: '12px 16px',
                        minWidth: 120,
                        textAlign: 'center',
                        fontWeight: 500,
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <img
                        src={
                          u.avatar ||
                          '/assets/avatar/0ba46bc7-b81b-44f2cbff.png'
                        }
                        alt={`${u.nickname}'s avatar`}
                        style={{
                          width: 40,
                          height: 40,
                          objectFit: 'cover',
                        }}
                      />
                      <div
                        style={{
                          color: '#fff',
                          fontSize: 14,
                          fontWeight: 'bold',
                          overflow: 'clip',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {u.nickname}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            // Level 2+: Show leaderboard
            <>
              <h2
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 600,
                  textAlign: 'center',
                  color: '#983a34',
                  marginBottom: 20,
                }}
              >
                Bảng Xếp Hạng
              </h2>

              {/* Top 9 in 3 columns */}
              {userList.length > 0 && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 15,
                    marginBottom: 20,
                  }}
                >
                  {(() => {
                    const sortedUsers = userList
                      .sort((a, b) => (b.score || 0) - (a.score || 0))
                      .slice(0, 9)

                    // Calculate ranks with tie handling
                    const usersWithRanks = []
                    let currentRank = 1

                    sortedUsers.forEach((user, idx) => {
                      if (idx === 0) {
                        usersWithRanks.push({ ...user, rank: 1 })
                      } else {
                        if (user.score === sortedUsers[idx - 1].score) {
                          // Same score as previous, same rank
                          usersWithRanks.push({
                            ...user,
                            rank: usersWithRanks[idx - 1].rank,
                          })
                        } else {
                          // Different score, rank = current index + 1
                          currentRank = idx + 1
                          usersWithRanks.push({ ...user, rank: currentRank })
                        }
                      }
                    })

                    return usersWithRanks.map((u, idx) => {
                      const getRankIcon = (rank) => {
                        if (rank === 1) return '👑'
                        if (rank === 2) return '🥈'
                        if (rank === 3) return '🥉'
                        return rank
                      }

                      const getRankColor = (rank) => {
                        if (rank === 1) return '#f8df52ff'
                        if (rank === 2) return '#94dff4'
                        if (rank === 3) return '#b0fac4ff'
                        return '#fff'
                      }

                      return (
                        <div
                          key={u.id || idx}
                          style={{
                            background: 'rgba(152, 58, 52, 0.8)',
                            borderRadius: 12,
                            padding: '10px 10px 10px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,

                            boxShadow:
                              u.rank <= 3
                                ? `0 4px 12px ${getRankColor(u.rank)}40`
                                : '0 2px 8px rgba(0,0,0,0.3)',
                          }}
                        >
                          {/* Rank */}
                          <div
                            style={{
                              minWidth: '40px',
                              height: '40px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background:
                                u.rank <= 3
                                  ? getRankColor(u.rank)
                                  : 'rgba(255, 255, 255, 0.2)',
                              borderRadius: '50%',
                              fontSize: u.rank <= 3 ? '20px' : '16px',
                              fontWeight: 'bold',
                              color: u.rank <= 3 ? '#fff' : '#fff',
                              textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                            }}
                          >
                            {getRankIcon(u.rank)}
                          </div>

                          {/* Avatar */}
                          <img
                            src={
                              u.avatar ||
                              '/assets/avatar/0ba46bc7-b81b-44f2cbff.png'
                            }
                            alt={`${u.nickname}'s avatar`}
                            style={{
                              width: 40,
                              height: 40,
                              objectFit: 'cover',
                            }}
                          />

                          {/* Name and Score */}
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                color: '#fff',
                                fontSize: 14,
                                fontWeight: 'bold',
                                marginBottom: 2,
                              }}
                            >
                              {u.nickname}
                            </div>
                            <div
                              style={{
                                color: getRankColor(u.rank),
                                fontSize: 12,
                                fontWeight: 'bold',
                              }}
                            >
                              {u.score || 0} điểm
                            </div>
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
