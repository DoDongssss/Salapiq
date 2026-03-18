import { useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { logout } from "@/services/AuthService"

const TIMEOUT_MS = 30 * 60 * 1000

export function useSessionTimeout() {
  const navigate = useNavigate()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const reset = () => {
      if (timer.current) clearTimeout(timer.current)

      timer.current = setTimeout(async () => {
        await logout()
        navigate("/auth/login", { replace: true })
      }, TIMEOUT_MS)
    }

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"]
    events.forEach((e) => window.addEventListener(e, reset))
    reset()

    return () => {
      if (timer.current) clearTimeout(timer.current)
      events.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [navigate])
}