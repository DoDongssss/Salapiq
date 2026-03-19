import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useSessionTimeout } from "@/hooks/useSessionTimeout"
import { logout } from "@/services/authService"

export default function Home() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  useSessionTimeout()

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth/login", { replace: true })
    }
  }, [user, loading, navigate])

  if (loading) return null

  const handleLogout = async () => {
    await logout()
    navigate("/auth/login", { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">
          Welcome to Salapiq
        </h1>
        <p className="text-stone-400 text-sm mt-1 font-light">
          {user?.email}
        </p>
        <button
          onClick={handleLogout}
          className="mt-6 mono text-[11px] text-stone-400 hover:text-red-500 transition-colors tracking-wide uppercase"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}