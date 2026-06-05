import { createContext, useContext, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as staffLogin, staffLogout, clientLogin as apiClientLogin, clientLogout } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  })
  const navigate = useNavigate()

  const login = useCallback(async (email, password) => {
    const { data } = await staffLogin(email, password)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    if (data.user.role === 'employee') {
      navigate('/panel/e')
    } else {
      navigate('/panel')
    }
  }, [navigate])

  const clientLogin = useCallback(async (email, password) => {
    const { data } = await apiClientLogin(email, password)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    navigate('/')
  }, [navigate])

  const logout = useCallback(async () => {
    const redirect = user?.type === 'staff' ? '/access' : '/login'
    try {
      if (user?.type === 'staff') {
        await staffLogout()
      } else {
        await clientLogout()
      }
    } catch {
      // always clear local state
    }
    localStorage.removeItem('user')
    setUser(null)
    navigate(redirect)
  }, [navigate, user])

  return (
    <AuthContext.Provider value={{ user, login, clientLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
