import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from "react"
import { useAuthStore } from "@/stores/useAuthStore"
import Home from './pages/Home'
import AuthLayout from './pages/layouts/AuthLayout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgetPassword from './pages/auth/ForgetPassword'
import VerifyEmail from './pages/auth/VerifyEmail'
import AuthCallback from './pages/auth/AuthCallback'
import SubscriberLayout from './pages/layouts/SubscriberLayout'
import Dashboard from './pages/subscriber/Dashboard'
import Accounts from './pages/subscriber/Accounts'
import Transactions from './pages/subscriber/Transactions'
import Settings from './pages/subscriber/Settings'
import FamilyShell from './pages/subscriber/Family'
import Ledger from './pages/subscriber/Ledger'
import Budget from './pages/subscriber/Budget'
import Savings from './pages/subscriber/Savings'
import Recurring from './pages/subscriber/Recurring'

function App() {
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    init()
  }, [init])

  return (
    <Router>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route path="/home" element={<Home />} />

        <Route path="/auth" element={<AuthLayout />}>
          <Route index element={<Navigate to="login" replace />} />
          <Route path="login"          element={<Login />}         />
          <Route path="register"       element={<Register />}      />
          <Route path="verify-email"   element={<VerifyEmail />}   />
          <Route path="forget-password" element={<ForgetPassword />} />
        </Route>

        <Route path="/app" element={<SubscriberLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"    element={<Dashboard />}    />
          <Route path="ledger" element={<Ledger />} />
          <Route path="budget" element={<Budget />} />
          <Route path="savings" element={<Savings />} />
          <Route path="accounts"     element={<Accounts />}     />
          <Route path="transactions" element={<Transactions />} />
          <Route path="recurring" element={<Recurring />} />
          <Route path="family/*"     element={<FamilyShell />}  />
          <Route path="settings"     element={<Settings />}     />
        </Route>

        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App