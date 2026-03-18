import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/useToast"

function parseCallbackError() {
  const params = new URLSearchParams(window.location.search)
  const error = params.get("error")
  const desc = params.get("error_description")
  if (error) return { error, description: desc?.replace(/\+/g, " ") ?? error }
  return null
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    const callbackError = parseCallbackError()

    if (callbackError) {
      if (callbackError.error === "access_denied") {
        toast({ type: "info", title: "Sign in cancelled", description: "You can try again anytime." })
        navigate("/auth/login", { replace: true })
      } else {
        toast({ type: "error", title: "Sign in failed", description: callbackError.description })
        navigate("/auth/login", { replace: true })
      }
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        subscription.unsubscribe()
        toast({ type: "success", title: "Welcome!", description: "You're now signed in to Salapiq." })
        navigate("/home", { replace: true })
      }
    })

    return () => subscription.unsubscribe()
  }, [navigate, toast])

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#f7f5f0]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
          <span className="text-[#0f1a12] font-semibold text-sm">S</span>
        </div>
        <div className="flex gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}