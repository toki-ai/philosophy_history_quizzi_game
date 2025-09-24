import { useEffect, useState } from 'react'
import { db } from './firebase/config'
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from 'firebase/firestore'
import EndGameScreen from './EndGameScreen'
import LearningScreen from './LearningScreen'
import ResultScreen from './ResultScreen'
import PlayingScreen from './PlayingScreen'

export default function PlayerView({ gameId, user, onBack }) {
  const [game, setGame] = useState(null)
  const [question, setQuestion] = useState(null)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [loading, setLoading] = useState(false)

  // Handle answer submission from PlayingScreen
  const handleAnswerSubmitted = () => {
    setShowResult(true)
  }
  const [gameNotFound, setGameNotFound] = useState(false)
  const [currentLevel, setCurrentLevel] = useState(1)
  const [players, setPlayers] = useState([])
  const [timeLeft, setTimeLeft] = useState(60)
  const [timerActive, setTimerActive] = useState(false)

  // Update currentLevel when game.level changes
  useEffect(() => {
    if (game?.level) {
      setCurrentLevel(game.level)
    }
  }, [game?.level])

  // Subscribe to game
  useEffect(() => {
    if (!gameId) return
    setGameNotFound(false)
    console.log('Subscribing to game:', gameId)
    const unsub = onSnapshot(doc(db, 'games', gameId), (snap) => {
      console.log('Game snapshot exists:', snap.exists())
      if (snap.exists()) {
        const data = snap.data()
        console.log('Game data:', data)
        setGame({ id: snap.id, ...data })
      } else {
        setGameNotFound(true)
      }
    })
    return () => unsub()
  }, [gameId])

  // Subscribe to players
  useEffect(() => {
    if (!gameId) return
    const unsub = onSnapshot(
      collection(db, 'games', gameId, 'players'),
      (snap) => {
        setPlayers(snap.docs.map((d) => d.data()))
      }
    )
    return () => unsub()
  }, [gameId])

  // Timer logic for question countdown
  useEffect(() => {
    if (!game) return

    // Start countdown when question starts playing
    if (game.questionStarted === 'playing' && !timerActive) {
      setTimeLeft(60)
      setTimerActive(true)
    } else if (game.questionStarted !== 'playing') {
      setTimerActive(false)
    }
  }, [game, timerActive])

  // Countdown timer effect
  useEffect(() => {
    if (!timerActive || timeLeft <= 0 || submitted) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1

        if (newTime <= 0) {
          setTimerActive(false)
          return 0
        }

        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timerActive, timeLeft, submitted])

  // Auto submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !submitted && game?.questionStarted === 'playing') {
      const autoSubmit = async () => {
        if (submitted) return
        setLoading(true)
        try {
          const isCorrect = selectedAnswer === question?.correctIndex
          // Calculate score: if correct, get 100 base points + remaining seconds as bonus
          const scoreIncrease = isCorrect ? 100 + timeLeft : 0

          // Get current player score from players array
          const currentPlayer = players.find(
            (p) => p.nickname === user.nickname
          )
          const currentScore = currentPlayer?.score || 0
          const newTotalScore = currentScore + scoreIncrease

          await updateDoc(doc(db, 'games', gameId, 'players', user.nickname), {
            answer: selectedAnswer,
            score: newTotalScore,
          })

          // Increment submitted count in game
          const gameRef = doc(db, 'games', gameId)
          await updateDoc(gameRef, {
            submittedCount: (game.submittedCount || 0) + 1,
          })

          user.score = newTotalScore
          localStorage.setItem('user', JSON.stringify(user))
          setSubmitted(true)
        } catch (err) {
          console.error('Auto submit error:', err)
        } finally {
          setLoading(false)
        }
      }
      autoSubmit()
    }
  }, [
    timeLeft,
    submitted,
    game?.questionStarted,
    selectedAnswer,
    question?.correctIndex,
    gameId,
    user,
    game?.submittedCount,
    players,
  ])

  // Reset answer when new question starts
  useEffect(() => {
    const questionStarted = game?.questionStarted || 'waiting'
    if (questionStarted === 'playing' && game?.currentQ) {
      setSelectedAnswer(null)
      setSubmitted(false)
      setShowResult(false) // Reset show result when new question starts
    }
  }, [game?.currentQ, game?.questionStarted])

  // Show result immediately when user submits
  useEffect(() => {
    if (submitted) {
      setShowResult(true)
    }
  }, [submitted])

  // Fetch question when currentQ changes
  useEffect(() => {
    if (!game?.currentQ || !currentLevel) return
    async function fetchQuestion() {
      try {
        console.log(
          'Fetching question for level:',
          currentLevel,
          'order:',
          game.currentQ
        )
        const q = query(
          collection(db, 'questions'),
          where('level', '==', currentLevel),
          where('order', '==', game.currentQ)
        )
        const snap = await getDocs(q)
        console.log('Query result:', snap.docs.length, 'docs')
        if (!snap.empty) {
          setQuestion(snap.docs[0].data())
        } else {
          console.log('No question found')
          setQuestion(null)
        }
      } catch (e) {
        console.error('Error fetching question:', e)
      }
    }
    fetchQuestion()
  }, [game?.currentQ, currentLevel])

  if (gameNotFound) return <div>Game not found. Please join a valid game.</div>

  if (!game) return <div>Loading game...</div>

  const questionStarted = game.questionStarted || 'waiting'

  if (questionStarted === 'endgame') {
    return <EndGameScreen players={players} onBack={onBack} user={user} />
  }

  if (questionStarted === 'home') {
    onBack()
    return null
  }

  if (questionStarted === 'playing') {
    if (!question) return <div>Loading question...</div>

    // If user has submitted, show result immediately
    if (showResult) {
      return (
        <ResultScreen
          question={question}
          selectedAnswer={selectedAnswer}
          onBack={onBack}
          players={players}
          user={user}
        />
      )
    }

    return (
      <PlayingScreen
        question={question}
        selectedAnswer={selectedAnswer}
        setSelectedAnswer={setSelectedAnswer}
        submitted={submitted}
        loading={loading}
        game={game}
        players={players}
        timeLeft={timeLeft}
        gameId={gameId}
        onGameUpdate={setGame}
        user={user}
        onBack={onBack}
        onAnswerSubmitted={handleAnswerSubmitted}
      />
    )
  }

  if (questionStarted === 'result') {
    if (!question) return <div>Loading result...</div>
    return (
      <ResultScreen
        question={question}
        selectedAnswer={selectedAnswer}
        onBack={onBack}
        players={players}
        user={user}
      />
    )
  }

  if (questionStarted === 'learn') {
    if (!question) return <div>Loading learning slide...</div>
    return <LearningScreen question={question} onBack={onBack} />
  }

  return <div>Waiting for admin...</div>
}
