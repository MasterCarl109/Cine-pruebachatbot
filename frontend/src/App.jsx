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

function ProtectedRoute({ children, roles, type, redirectTo }) {
  const stored = localStorage.getItem('user')
  if (!stored) return <Navigate to={redirectTo || '/login'} replace />
  const user = JSON.parse(stored)
  if (type && user.type !== type) return <Navigate to="/" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
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
              <ProtectedRoute type="client" roles={['client']}>
                <ClientReservations />
              </ProtectedRoute>
            } />
          </Route>

          {/* ===== PORTAL STAFF ===== */}
          <Route path="/access" element={<StaffLogin />} />

          <Route path="/panel" element={
            <ProtectedRoute type="staff" roles={['admin', 'manager']} redirectTo="/access">
              <StaffLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="p" element={<AdminMovies />} />
            <Route path="d" element={<AdminDirectors />} />
            <Route path="g" element={<AdminGenres />} />
            <Route path="t" element={<AdminStores />} />
            <Route path="u" element={
              <ProtectedRoute type="staff" roles={['admin']} redirectTo="/access">
                <AdminUsers />
              </ProtectedRoute>
            } />
          </Route>

          <Route path="/panel/e" element={
            <ProtectedRoute type="staff" roles={['employee']} redirectTo="/access">
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
