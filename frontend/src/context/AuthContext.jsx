import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as staffLogin, staffLogout, getStaffMe, clientLogin as apiClientLogin, clientLogout, getClientProfile } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const setSessionUser = useCallback((userData) => {
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }, [])

  const clearSession = useCallback(() => {
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await getStaffMe()
        if (data?.user) {
          setSessionUser(data.user)
          setLoading(false)
          return
        }
      } catch { /* not staff */ }

      try {
        const { data } = await getClientProfile()
        if (data?.id) {
          setSessionUser({ id: data.id, name: data.name, email: data.email, type: data.type, role: data.role })
          setLoading(false)
          return
        }
      } catch { /* not client */ }

      clearSession()
      setLoading(false)
    })()
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await staffLogin(email, password)
    setSessionUser(data.user)
    if (data.user.role === 'employee') {
      navigate('/panel/e')
    } else {
      navigate('/panel')
    }
  }, [navigate])

  const clientLogin = useCallback(async (email, password) => {
    const { data } = await apiClientLogin(email, password)
    setSessionUser(data.user)
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
    clearSession()
    navigate(redirect)
  }, [navigate, user])

  return (
    <AuthContext.Provider value={{ user, loading, login, clientLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
