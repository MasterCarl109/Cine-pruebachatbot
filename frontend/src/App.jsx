import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, CssBaseline } from '@mui/material'
import theme from './theme'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/layout/Layout'
import ChatWidget from './components/chat/ChatWidget'
import MovieGrid from './components/catalog/MovieGrid'
import LoginPage from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import AdminMovies from './pages/AdminMovies'
import AdminDirectors from './pages/AdminDirectors'
import AdminGenres from './pages/AdminGenres'
import AdminStores from './pages/AdminStores'
import AdminUsers from './pages/AdminUsers'
import EmployeePanel from './pages/EmployeePanel'

function ProtectedRoute({ children, roles }) {
  const token = localStorage.getItem('token')
  const stored = localStorage.getItem('user')
  if (!token) return <Navigate to="/login" replace />
  if (roles && stored) {
    const user = JSON.parse(stored)
    if (!roles.includes(user.role)) return <Navigate to="/" replace />
  }
  return children
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<MovieGrid />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admin" element={<ProtectedRoute roles={['admin', 'manager']}><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/movies" element={<ProtectedRoute roles={['admin', 'manager']}><AdminMovies /></ProtectedRoute>} />
              <Route path="/admin/directors" element={<ProtectedRoute roles={['admin', 'manager']}><AdminDirectors /></ProtectedRoute>} />
              <Route path="/admin/genres" element={<ProtectedRoute roles={['admin', 'manager']}><AdminGenres /></ProtectedRoute>} />
              <Route path="/admin/stores" element={<ProtectedRoute roles={['admin', 'manager']}><AdminStores /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
              <Route path="/employee" element={<ProtectedRoute roles={['employee']}><EmployeePanel /></ProtectedRoute>} />
            </Routes>
          </Layout>
          <ChatWidget />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
