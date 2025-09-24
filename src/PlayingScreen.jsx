import { useEffect, useState } from 'react'
import { db } from './firebase/config'
import {
  doc,
  onSnapshot,
  updateDoc,
  setDoc,
  query,
  collection,
  where,
  getDocs,
} from 'firebase/firestore'
import { MdAccessTime } from 'react-icons/md'
import { FaUsers, FaTrash, FaGem, FaMedal } from 'react-icons/fa'

export default function PlayingScreen({
  question,
  setSelectedAnswer,
  submitted,
  game,
  players,
  timeLeft,
  gameId,
  onGameUpdate,
  user,
  onBack,
  onAnswerSubmitted, // New callback for when answer is submitted
}) {
  const [hoveredHelp, setHoveredHelp] = useState(null)
  const [answerResult, setAnswerResult] = useState(null) // 'correct', 'wrong', or null

  // Help tools state
  const [helpTools, setHelpTools] = useState({
    help5050: false,
    helpRemove: false,
    helpDouble: false,
  })
  const [hiddenAnswers, setHiddenAnswers] = useState([])
  const [doublePointsActive, setDoublePointsActive] = useState(false)

  // Initialize help tools from localStorage for current game
  useEffect(() => {
    const gameStorageKey = `helpTools_${gameId}`
    const savedHelps = localStorage.getItem(gameStorageKey)
    if (savedHelps) {
      setHelpTools(JSON.parse(savedHelps))
    } else {
      // Reset help tools for new game
      const initialHelps = {
        help5050: false,
        helpRemove: false,
        helpDouble: false,
      }
      setHelpTools(initialHelps)
      localStorage.setItem(gameStorageKey, JSON.stringify(initialHelps))
    }
  }, [gameId])

  // Reset help effects when new question starts
  useEffect(() => {
    setHiddenAnswers([])
    setDoublePointsActive(false)
  }, [question])

  // Help tool handlers
  const handleHelpTool = (helpType) => {
    const gameStorageKey = `helpTools_${gameId}`
    const updatedHelps = { ...helpTools, [helpType]: true }
    setHelpTools(updatedHelps)
    localStorage.setItem(gameStorageKey, JSON.stringify(updatedHelps))

    if (helpType === 'help5050') {
      // Hide 2 wrong answers
      const correctIndex = parseInt(question.correctIndex)
      const wrongIndices = [0, 1, 2, 3].filter((i) => i !== correctIndex)
      const toHide = wrongIndices.slice(0, 2)
      setHiddenAnswers(toHide)
    } else if (helpType === 'helpRemove') {
      // Hide 1 wrong answer
      const correctIndex = parseInt(question.correctIndex)
      const wrongIndices = [0, 1, 2, 3].filter((i) => i !== correctIndex)
      const toHide = [wrongIndices[0]]
      setHiddenAnswers(toHide)
    } else if (helpType === 'helpDouble') {
      // Activate double points for this question
      setDoublePointsActive(true)
    }
  }

  // Realtime update for game data
  useEffect(() => {
    if (!gameId) return

    const unsubscribe = onSnapshot(doc(db, 'games', gameId), (snapshot) => {
      if (snapshot.exists()) {
        const gameData = { id: snapshot.id, ...snapshot.data() }
        console.log('Game data updated:', gameData)
        onGameUpdate?.(gameData)
      }
    })

    return () => unsubscribe()
  }, [gameId, onGameUpdate])

  // Listen to players subcollection for real-time updates
  useEffect(() => {
    if (!gameId) return

    const unsubscribe = onSnapshot(
      doc(db, 'games', gameId, 'players', user?.nickname),
      (snapshot) => {
        if (snapshot.exists()) {
          const playerData = snapshot.data()
          console.log('Player data updated:', playerData)
          console.log('Player score from Firebase:', playerData.score)
        } else {
          console.log('Player document does not exist')
        }
      }
    )

    return () => unsubscribe()
  }, [gameId, user?.nickname])

  // Reset answer result when question changes
  useEffect(() => {
    setAnswerResult(null)
  }, [question])

  // Format time as mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`
  }

  // Auto-submit when answer is selected
  const handleAnswerSelect = async (answerIndex) => {
    if (!submitted) {
      setSelectedAnswer(answerIndex)

      // Submit answer immediately
      try {
        // Ensure both values are numbers for comparison
        const correctIndex = parseInt(question.correctIndex)
        const selectedIndex = parseInt(answerIndex)
        const isCorrect = selectedIndex === correctIndex

        // Calculate score with time bonus and double points
        let scoreIncrease = 0
        if (isCorrect) {
          let baseScore = 100 + timeLeft // 100 base + time bonus
          if (doublePointsActive) {
            baseScore *= 2 // Double points if help was used
          }
          scoreIncrease = baseScore
        }

        // Get current player for score calculation
        const currentPlayerData =
          players.find((p) => p.nickname === user?.nickname) || user

        // Debug: Log values to check
        console.log('Question object:', question)
        console.log(
          'Answer Index:',
          answerIndex,
          '(type:',
          typeof answerIndex,
          ')'
        )
        console.log(
          'Correct Index:',
          question.correctIndex,
          '(type:',
          typeof question.correctIndex,
          ')'
        )
        console.log('Parsed Answer:', selectedIndex)
        console.log('Parsed Correct:', correctIndex)
        console.log('Is Correct:', isCorrect)
        console.log('Time Left:', timeLeft)
        console.log('Double Points Active:', doublePointsActive)
        console.log('Score Increase:', scoreIncrease)
        console.log('Current Player Data:', currentPlayerData)
        console.log('Current Score:', currentPlayerData?.score || 0)

        // Set answer result for UI feedback
        setAnswerResult(isCorrect ? 'correct' : 'wrong')

        // Calculate new total score
        const currentScore = currentPlayerData?.score || 0
        const newTotalScore = currentScore + scoreIncrease

        console.log('New Total Score:', newTotalScore)

        // Debug path components
        console.log('GameId:', gameId)
        console.log('User nickname:', user?.nickname)
        console.log('User object:', user)

        // Update player data in game subcollection
        console.log(
          'Updating game player with path: games/' +
            gameId +
            '/players/' +
            user?.nickname
        )
        try {
          const q = query(
            collection(db, 'games', gameId, 'players'),
            where('nickname', '==', user?.nickname)
          )
          const querySnapshot = await getDocs(q)
          if (querySnapshot.empty) {
            console.log('No player document found, creating one')
            await setDoc(doc(db, 'games', gameId, 'players', user?.nickname), {
              nickname: user?.nickname,
              score: scoreIncrease,
              answer: answerIndex,
            })
          } else {
            querySnapshot.forEach(async (docSnap) => {
              const currentScore = docSnap.data().score || 0
              const newTotalScore = currentScore + scoreIncrease
              await updateDoc(docSnap.ref, {
                answer: answerIndex,
                score: newTotalScore,
              })
              console.log('Player score updated successfully')
            })
          }

          console.log('Game player updated successfully')
        } catch (gameError) {
          console.error('Error updating game player:', gameError)
          console.log(
            'Game player update failed - maybe document does not exist'
          )
        }

        // Update user's score in main users collection - REMOVED to avoid redundancy
        // Only keep score in game players subcollection
        console.log(
          'Skipping users collection update - only using game players'
        )

        console.log('Updated both game players and users collection')

        // Increment submitted count
        const gameRef = doc(db, 'games', gameId)
        await updateDoc(gameRef, {
          submittedCount: (game.submittedCount || 0) + 1,
        })

        // Show result feedback for 2 seconds, then switch to result screen
        setTimeout(() => {
          setAnswerResult(null) // Clear the result display
          // Notify parent component to switch to result screen
          onAnswerSubmitted?.()
        }, 2000)

        // After submitting, immediately check if this user should see results
        // Each user will see results immediately after their submission
        console.log('User submitted answer, should show result now')
      } catch (error) {
        console.error('Error submitting answer:', error)
      }
    }
  }

  // Answer colors - retro style
  const answerColors = [
    { bg: '#FF6B6B', hover: '#FF5252' }, // Red
    { bg: '#4ECDC4', hover: '#26C6DA' }, // Teal
    { bg: '#FFD93D', hover: '#FFC107' }, // Yellow
    { bg: '#6BCF7F', hover: '#4CAF50' }, // Green
  ]

  const currentPlayer =
    players.find((p) => p.nickname === user?.nickname) || user // Find current logged-in user

  // Calculate player rank based on scores
  const sortedPlayers = [...players].sort(
    (a, b) => (b.score || 0) - (a.score || 0)
  )
  const playerRank =
    sortedPlayers.findIndex((p) => p.nickname === user?.nickname) + 1 || 1
  const playerScore = currentPlayer?.score || 0
  return (
    <div
      style={{
        height: '100vh',
        margin: 0,
        backgroundImage: `url(${question.backgroundImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center bottom',
        display: 'flex',
        flexDirection: 'column',
        color: '#fff',
        padding: 0,
        boxSizing: 'border-box',
        position: 'relative',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Background overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.3)',
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
          padding: '8px 12px',
          color: '#983a34',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
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

      {/* Top Left - Rank & Score */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 120,
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div
          style={{
            border: '1px solid #ccc',
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            padding: '10px 20px',
            borderRadius: 25,
            fontSize: 20,
            fontWeight: 'bold',
            color: '#983a34',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <FaMedal size={20} />
          {playerRank}
        </div>
        <div
          style={{
            border: '1px solid #ccc',
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            padding: '8px 16px',
            borderRadius: 20,
            fontSize: 15,
            color: '#302f2fff',
            textAlign: 'center',
          }}
        >
          {playerScore} pts
        </div>
      </div>

      {/* Top Right - Timer & Submitted Count */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          alignItems: 'flex-end',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid #ccc',
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            padding: '10px 20px',
            borderRadius: 25,
            fontSize: 18,
            fontWeight: 'bold',
            color: timeLeft <= 10 ? '#ff4444' : '#302f2fff',
          }}
        >
          <MdAccessTime size={20} />
          {formatTime(timeLeft)}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid #ccc',
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            padding: '8px 16px',
            borderRadius: 20,
            fontSize: 16,
            color: '#302f2fff',
          }}
        >
          <FaUsers size={16} />
          {game?.submittedCount || 0}/
          {players.filter((p) => p.role === 'user').length}
        </div>
      </div>

      {/* Question Container - Center */}
      <div
        style={{
          zIndex: 2,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 50px',
        }}
      >
        {/* Question Box */}
        <div
          style={{
            padding: '10px 40px 10px 40px',
            borderRadius: 20,
            marginBottom: 40,
            maxWidth: '800px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 16,
              color: '#983a34',
              marginBottom: 15,
              fontWeight: 'bold',
            }}
          >
            Câu {game?.currentQuestionIndex + 1 || 1} /{' '}
            {game?.totalQuestions || 10}
          </div>
          <h2
            style={{
              color: '#fff',
              fontWeight: 600,
              fontSize: 24,
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {question.text}
          </h2>
        </div>

        {/* Answer Options - 2x2 Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
            width: '100%',
            maxWidth: '800px',
          }}
        >
          {question.options.map((opt, idx) => {
            // Check if this answer should be hidden
            if (hiddenAnswers.includes(idx)) {
              return (
                <div
                  key={idx}
                  style={{
                    padding: '30px 20px',
                    background: '#666',
                    border: 'none',
                    color: '#999',
                    borderRadius: 15,
                    fontSize: 20,
                    minHeight: '120px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    opacity: 0.3,
                  }}
                >
                  ❌ Đã loại bỏ
                </div>
              )
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswerSelect(idx)}
                disabled={submitted}
                style={{
                  padding: '30px 20px',
                  background: answerColors[idx].bg,
                  border: 'none',
                  color: '#000000ff',
                  borderRadius: 15,
                  fontSize: 20,
                  cursor: submitted ? 'not-allowed' : 'pointer',
                  opacity: submitted ? 0.7 : 1,
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                  minHeight: '120px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  transform: submitted ? 'none' : 'scale(1)',
                }}
                onMouseEnter={(e) => {
                  if (!submitted) {
                    e.target.style.background = answerColors[idx].hover
                    e.target.style.transform = 'scale(1.05)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submitted) {
                    e.target.style.background = answerColors[idx].bg
                    e.target.style.transform = 'scale(1)'
                  }
                }}
              >
                {opt}
              </button>
            )
          })}
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background:
            answerResult === 'correct'
              ? 'rgba(76, 175, 80, 0.9)' // Green for correct
              : answerResult === 'wrong'
              ? 'rgba(244, 67, 54, 0.9)' // Red for wrong
              : 'rgba(255, 255, 255, 0.5)', // Default
          border: '1px solid #ccc',
          padding: '5px 30px',
          zIndex: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'background 0.3s ease',
        }}
      >
        {/* Left - Player Info & Help Tools */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 15,
              borderRight: '2px solid #983a34',
              paddingRight: 20,
            }}
          >
            <img
              src={
                currentPlayer?.avatar || user?.avatar || '/default-avatar.png'
              }
              alt='Player'
              style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
            <div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: '#983a34',
                }}
              >
                {currentPlayer?.nickname || 'User'}
              </div>
            </div>
          </div>

          {/* Help Tools */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
            }}
          >
            {/* 50/50 Help */}
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => setHoveredHelp('5050')}
              onMouseLeave={() => setHoveredHelp(null)}
            >
              <button
                onClick={() =>
                  !helpTools.help5050 && handleHelpTool('help5050')
                }
                disabled={helpTools.help5050 || submitted}
                style={{
                  background: helpTools.help5050 ? '#999' : '#FF6B6B',
                  border: 'none',
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor:
                    helpTools.help5050 || submitted ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: '#fff',
                  transition: 'transform 0.2s',
                  opacity: helpTools.help5050 ? 0.6 : 1,
                }}
                onMouseEnter={(e) =>
                  !helpTools.help5050 &&
                  (e.target.style.transform = 'scale(1.1)')
                }
                onMouseLeave={(e) =>
                  !helpTools.help5050 && (e.target.style.transform = 'scale(1)')
                }
              >
                50/50
              </button>
              {hoveredHelp === '5050' && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '50px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#983a34',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                  }}
                >
                  Loại bỏ 2 đáp án sai
                </div>
              )}
            </div>

            {/* Remove Wrong Answer */}
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => setHoveredHelp('remove')}
              onMouseLeave={() => setHoveredHelp(null)}
            >
              <button
                onClick={() =>
                  !helpTools.helpRemove && handleHelpTool('helpRemove')
                }
                disabled={helpTools.helpRemove || submitted}
                style={{
                  background: helpTools.helpRemove ? '#999' : '#4ECDC4',
                  border: 'none',
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor:
                    helpTools.helpRemove || submitted
                      ? 'not-allowed'
                      : 'pointer',
                  color: '#fff',
                  transition: 'transform 0.2s',
                  opacity: helpTools.helpRemove ? 0.6 : 1,
                }}
                onMouseEnter={(e) =>
                  !helpTools.helpRemove &&
                  (e.target.style.transform = 'scale(1.1)')
                }
                onMouseLeave={(e) =>
                  !helpTools.helpRemove &&
                  (e.target.style.transform = 'scale(1)')
                }
              >
                <FaTrash size={16} />
              </button>
              {hoveredHelp === 'remove' && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '50px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#983a34',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                  }}
                >
                  Loại 1 đáp án sai
                </div>
              )}
            </div>

            {/* Double Points */}
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => setHoveredHelp('double')}
              onMouseLeave={() => setHoveredHelp(null)}
            >
              <button
                onClick={() =>
                  !helpTools.helpDouble && handleHelpTool('helpDouble')
                }
                disabled={helpTools.helpDouble || submitted}
                style={{
                  background: helpTools.helpDouble ? '#999' : '#FFD93D',
                  border: 'none',
                  borderRadius: '50%',
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor:
                    helpTools.helpDouble || submitted
                      ? 'not-allowed'
                      : 'pointer',
                  color: helpTools.helpDouble ? '#fff' : '#333',
                  transition: 'transform 0.2s',
                  opacity: helpTools.helpDouble ? 0.6 : 1,
                }}
                onMouseEnter={(e) =>
                  !helpTools.helpDouble &&
                  (e.target.style.transform = 'scale(1.1)')
                }
                onMouseLeave={(e) =>
                  !helpTools.helpDouble &&
                  (e.target.style.transform = 'scale(1)')
                }
              >
                <FaGem size={16} />
              </button>
              {hoveredHelp === 'double' && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '50px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#983a34',
                    color: '#fff',
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    whiteSpace: 'nowrap',
                    zIndex: 10,
                  }}
                >
                  Nhân đôi điểm số
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right - Answer Result */}
        <div>
          {answerResult === 'correct' && (
            <div
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              ✅ Đáp án chính xác
            </div>
          )}
          {answerResult === 'wrong' && (
            <div
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              ❌ Đáp án sai
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
