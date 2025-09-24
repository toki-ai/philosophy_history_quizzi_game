import { useState } from 'react'
import { db } from './firebase/config'
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore'

export default function LoginForm({ onLogin, onAdminLogin }) {
  const [nickname, setNickname] = useState('')
  const [role, setRole] = useState('user')
  const [gameCode, setGameCode] = useState('')
  const [adminCode, setAdminCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState(0)

  // List of available avatars
  const avatars = [
    '/assets/avatar/0807ac9f-7b9c-43bbe50a82e08.png',
    '/assets/avatar/0ba46bc7-b81b-44f2cbff.png',
    '/assets/avatar/1c87f596dbbaaebf059259272e46.png',
    '/assets/avatar/2e7c9dc183e550431672a6911739.png',
    '/assets/avatar/6f0439fa-c2e4-481e-80-b73f27ead2.png',
    '/assets/avatar/872dc38f-b629-477f-90ed-59ef5f02b.png',
    '/assets/avatar/9565b9ab1d005c5f9aef0e4eb.png',
    '/assets/avatar/b563bd2b-cedc7a-b343-c9854ad31a46.png',
    '/assets/avatar/c1f64e87-8afb-47fa-b5c9-ce4bce69e.png',
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    console.log('🚀 Login attempt started:', {
      nickname,
      role,
      gameCode,
      adminCode,
    })

    try {
      if (!nickname || nickname.trim() === '') {
        throw new Error('Nickname không được để trống!')
      }

      if (role === 'admin') {
        console.log('👑 Admin login flow')
        if (adminCode !== '1234') throw new Error('Admin code không đúng!')

        console.log('📝 Creating admin user in Firestore...')
        // Tạo user admin trong Firestore nếu chưa có
        const userRef = doc(db, 'users', nickname)
        await setDoc(userRef, {
          nickname,
          role: 'admin',
          score: 0,
          avatar: avatars[selectedAvatarIndex],
        })

        console.log('✅ Admin user created successfully')

        // Lưu vào localStorage
        const userData = {
          nickname,
          role: 'admin',
          score: 0,
          avatar: avatars[selectedAvatarIndex],
        }
        localStorage.setItem('user', JSON.stringify(userData))
        console.log('💾 Admin data saved to localStorage:', userData)

        if (onAdminLogin) onAdminLogin(userData)
        return
      }
      // User flow: must enter 5-digit game code
      console.log('👤 User login flow')
      console.log('🔍 Validating game code:', gameCode)

      if (!/^[0-9]{5}$/.test(gameCode)) {
        throw new Error('Game code phải gồm 5 chữ số!')
      }

      console.log('🎮 Searching for game with code:', gameCode)
      // Check if game exists
      const gamesRef = collection(db, 'games')
      const q = query(gamesRef, where('code', '==', gameCode))
      const snap = await getDocs(q)

      console.log('📊 Query result:', { empty: snap.empty, size: snap.size })

      let gameId
      if (!snap.empty) {
        // Join existing game
        const gameDoc = snap.docs[0]
        const gameData = gameDoc.data()
        gameId = gameDoc.id

        console.log('🎯 Found game:', {
          gameId,
          status: gameData.status,
          data: gameData,
        })

        if (gameData.status !== 'in-progress') {
          throw new Error('Game code không hợp lệ hoặc game chưa bắt đầu!')
        }
      } else {
        console.log('❌ No game found with code:', gameCode)
        throw new Error('Game code không tồn tại!')
      }
      console.log('👥 Adding player to game...')
      // Add player to games/{gameId}/players
      const playerRef = doc(db, 'games', gameId, 'players', nickname)
      await setDoc(playerRef, {
        nickname,
        role: 'user',
        score: 0,
        avatar: avatars[selectedAvatarIndex],
      })

      console.log('✅ Player added to game successfully')

      console.log('📝 Creating user document...')
      // Also create/update user document
      const userRef = doc(db, 'users', nickname)
      await setDoc(userRef, {
        nickname,
        role: 'user',
        score: 0,
        level: 1,
        avatar: avatars[selectedAvatarIndex],
      })

      console.log('✅ User document created successfully')

      // Save to localStorage
      const userData = {
        nickname,
        role: 'user',
        gameId,
        score: 0,
        avatar: avatars[selectedAvatarIndex],
      }
      localStorage.setItem('user', JSON.stringify(userData))
      console.log('💾 User data saved to localStorage:', userData)

      console.log('🚀 Calling onLogin callback...')
      onLogin(userData)
    } catch (err) {
      console.error('❌ Login error:', err)
      console.error('Error details:', { code: err.code, message: err.message })
      setError(err.message)
    } finally {
      setLoading(false)
      console.log('🏁 Login process completed')
    }
  }

  return (
    <div
      style={{
        backgroundImage: "url('/assets/background/login.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 500,
          padding: 20,
          border: '1px solid #ccc',
          borderRadius: 20,
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
        }}
      >
        <form onSubmit={handleSubmit}>
          {/* Avatar Selector */}
          <div
            style={{
              marginBottom: 20,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <button
              type='button'
              onClick={() =>
                setSelectedAvatarIndex((prev) =>
                  prev > 0 ? prev - 1 : avatars.length - 1
                )
              }
              style={{
                padding: '8px 12px',
                background: 'transparent',
                color: '#983a34',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label='Previous avatar'
            >
              <svg
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <polygon points='16,4 8,12 16,20' fill='currentColor' />
              </svg>
            </button>
            <div
              style={{
                height: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={avatars[selectedAvatarIndex]}
                alt='Selected avatar'
                style={{
                  width: 80,
                  objectFit: 'cover',
                }}
              />
            </div>
            <button
              type='button'
              onClick={() =>
                setSelectedAvatarIndex((prev) =>
                  prev < avatars.length - 1 ? prev + 1 : 0
                )
              }
              style={{
                padding: '8px 12px',
                background: 'transparent',
                color: '#983a34',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label='Next avatar'
            >
              <svg
                width='24'
                height='24'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <polygon points='8,4 16,12 8,20' fill='currentColor' />
              </svg>
            </button>
          </div>
          <div
            style={{
              marginBottom: 15,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <label htmlFor='nickname'>Tên của bạn:</label>
            <input
              id='nickname'
              type='text'
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              required
              style={{
                flex: 1,
                padding: 2,
                marginTop: 5,
                border: 'none',
                background: 'transparent',
                borderBottom: '2px solid #983a34',
                outline: 'none',
                boxShadow: 'none',
                color: '#983a34',
                fontWeight: 600,
                fontSize: 16,
                transition: 'background 0s',
              }}
            />
          </div>

          {role === 'user' && (
            <div style={{ marginBottom: 15, display: 'flex' }}>
              <label htmlFor='gameCode'>Game Code:</label>
              <input
                id='gameCode'
                type='text'
                value={gameCode}
                onChange={(e) =>
                  setGameCode(e.target.value.replace(/\D/g, '').slice(0, 5))
                }
                required
                style={{
                  flex: 1,
                  padding: 2,
                  marginLeft: 10,
                  border: 'none',
                  background: 'transparent',
                  borderBottom: '2px solid #983a34',
                  outline: 'none',
                  boxShadow: 'none',
                  color: '#983a34',
                  fontWeight: 600,
                  fontSize: 16,
                  transition: 'background 0s',
                  letterSpacing: 2,
                }}
              />
            </div>
          )}
          {role === 'admin' && (
            <div style={{ marginBottom: 15, display: 'flex' }}>
              <label htmlFor='adminCode'>Mật khẩu:</label>
              <input
                id='adminCode'
                type='password'
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                required
                style={{
                  padding: 2,
                  flex: 1,
                  marginLeft: 10,
                  border: 'none',
                  background: 'transparent',
                  borderBottom: '2px solid #983a34',
                  outline: 'none',
                  boxShadow: 'none',
                  color: '#983a34',
                  fontWeight: 600,
                  fontSize: 16,
                  transition: 'background 0s',
                }}
              />
            </div>
          )}
          <div
            style={{
              marginBottom: 15,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <input
              id='isAdmin'
              type='checkbox'
              checked={role === 'admin'}
              onChange={(e) => setRole(e.target.checked ? 'admin' : 'user')}
              style={{
                width: 18,
                height: 18,
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                outline: 'none',
                border: '2px solid #983a34',
                borderRadius: 4,
                background: 'transparent',
                cursor: 'pointer',
                display: 'inline-block',
                position: 'relative',
              }}
              onFocus={(e) => (e.target.style.boxShadow = '0 0 0 2px #f5e2e0')}
              onBlur={(e) => (e.target.style.boxShadow = 'none')}
            ></input>
            {/* Custom style for checkbox border only */}
            <style>{`
          input[type="checkbox"] {
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            outline: none;
            border: 2px solid #983a34;
            border-radius: 4px;
            background: transparent;
            cursor: pointer;
            width: 18px;
            height: 18px;
            display: inline-block;
            position: relative;
          }
          input[type="checkbox"]:checked::after {
            content: '';
            display: block;
            width: 10px;
            height: 10px;
            margin: 2px auto;
            background: #983a34;
            border-radius: 2px;
          }
          input[type="checkbox"]::after {
            content: '';
            display: block;
            width: 10px;
            height: 10px;
            margin: 2px auto;
            background: transparent;
            border-radius: 2px;
          }
        `}</style>
            <label
              htmlFor='isAdmin'
              style={{
                userSelect: 'none',
                cursor: 'pointer',
                color: '#983a34',
                fontStyle: 'italic',
                fontSize: 14,
              }}
            >
              Bạn là chủ phòng?
            </label>
          </div>
          {error && (
            <p
              style={{ color: '#000000ff', fontWeight: 600, marginBottom: 15 }}
            >
              {error}
            </p>
          )}
          <button
            type='submit'
            disabled={loading}
            style={{
              width: '100%',
              padding: 10,
              backgroundColor: '#983a34',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  )
}
