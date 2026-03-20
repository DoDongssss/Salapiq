import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import type { User, Session } from "@supabase/supabase-js"
import { useAccountStore } from "@/stores/useAccountStore" 

export function useAuth() {
  const [user,    setUser]    = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const resetAccounts = useAccountStore((s) => s.reset) 

  useEffect(() => {
    let mounted = true

    const init = async () => {
      const { data } = await supabase.auth.getSession()

      if (!mounted) return

      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (_event === "SIGNED_OUT") resetAccounts()

        setSession((prev) => {
          if (prev?.access_token === newSession?.access_token) return prev
          return newSession
        })

        setUser((prev) => {
          if (prev?.id === newSession?.user?.id) return prev
          return newSession?.user ?? null
        })
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [resetAccounts])

  return { user, session, loading }
}