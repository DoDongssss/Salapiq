import React from "react"
import { Outlet, Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"

const AuthLayout: React.FC = () => {
  const { user, loading } = useAuth()

  if (loading) return null

  if (user) return <Navigate to="/app/dashboard" replace />

  return (
    <div className="h-screen w-full flex items-center justify-center">
      <Outlet />
    </div>
  )
}

export default AuthLayout