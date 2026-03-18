import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import AuthLayout from './pages/layouts/AuthLayout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgetPassword from './pages/auth/ForgetPassword'
import VerifyEmail from './pages/auth/VerifyEmail'
import AuthCallback from './pages/auth/AuthCallback'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/home" element={<Home />} />

        <Route path="/auth" element={<AuthLayout />}>
          <Route index element={<Navigate to="login" replace />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="verify-email" element={<VerifyEmail />} />
          <Route path="forget-password" element={<ForgetPassword />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App