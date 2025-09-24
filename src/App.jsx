import { useState, useEffect } from 'react'
import LoginForm from './LoginForm'
import HomePage from './HomePage'

function App() {
  const [user, setUser] = useState(null)

  // Load user from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Error parsing saved user:', error)
        localStorage.removeItem('user')
      }
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <div className='App'>
      {user ? (
        <HomePage user={user} onLogout={handleLogout} />
      ) : (
        <LoginForm onLogin={handleLogin} />
      )}
    </div>
  )
}

export default App
