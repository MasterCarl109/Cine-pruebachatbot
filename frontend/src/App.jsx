import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ClientLayout from './components/layout/ClientLayout'
import StaffLayout from './components/layout/StaffLayout'
import HomePage from './pages/HomePage'
import MovieGrid from './components/catalog/MovieGrid'
import LoginPage from './pages/Login'
import RegisterPage from './pages/Register'
import StaffLogin from './pages/StaffLogin'
import AdminDashboard from './pages/AdminDashboard'
import AdminMovies from './pages/AdminMovies'
import AdminDirectors from './pages/AdminDirectors'
import AdminGenres from './pages/AdminGenres'
import AdminStores from './pages/AdminStores'
import AdminUsers from './pages/AdminUsers'
import EmployeePanel from './pages/EmployeePanel'
import ClientReservations from './pages/ClientReservations'

function ProtectedRoute({ children, roles, redirectTo }) {
  const token = localStorage.getItem('token')
  const stored = localStorage.getItem('user')
  if (!token) return <Navigate to={redirectTo || '/login'} replace />
  if (roles && stored) {
    const user = JSON.parse(stored)
    if (!roles.includes(user.role)) return <Navigate to="/" replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ===== PORTAL CLIENTE ===== */}
          <Route path="/" element={<ClientLayout />}>
            <Route index element={<HomePage />} />
            <Route path="catalogo" element={<MovieGrid />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="registro" element={<RegisterPage />} />
            <Route path="mis-reservas" element={
              <ProtectedRoute roles={['client']}>
                <ClientReservations />
              </ProtectedRoute>
            } />
          </Route>

          {/* ===== PORTAL STAFF ===== */}
          <Route path="/staff/login" element={<StaffLogin />} />

          <Route path="/staff" element={
            <ProtectedRoute roles={['admin', 'manager']} redirectTo="/staff/login">
              <StaffLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="peliculas" element={<AdminMovies />} />
            <Route path="directores" element={<AdminDirectors />} />
            <Route path="generos" element={<AdminGenres />} />
            <Route path="tiendas" element={<AdminStores />} />
            <Route path="usuarios" element={
              <ProtectedRoute roles={['admin']} redirectTo="/staff/login">
                <AdminUsers />
              </ProtectedRoute>
            } />
          </Route>

          <Route path="/staff/empleado" element={
            <ProtectedRoute roles={['employee']} redirectTo="/staff/login">
              <StaffLayout />
            </ProtectedRoute>
          }>
            <Route index element={<EmployeePanel />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
