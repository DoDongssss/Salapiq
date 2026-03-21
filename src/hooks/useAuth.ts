import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import type { User, Session } from "@supabase/supabase-js"
import { useAccountStore }      from "@/stores/useAccountStore"
import { useFamilyStore }       from "@/stores/useFamilyStore"
import { useTransactionStore }  from "@/stores/useTransactionStore"
import { useNotificationStore } from "@/stores/useNotificationStore"
import { useProfileStore }      from "@/stores/useProfileStore"
import { useSettingStore }      from "@/stores/useSettingStore"
import { useSavingsStore }      from "@/stores/useSavingsStore"
import { useBudgetStore }       from "@/stores/useBudgetStore"

export function useAuth() {
  const [user,    setUser]    = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const resetAccounts      = useAccountStore((s) => s.reset)
  const resetFamily        = useFamilyStore((s) => s.reset)
  const resetTransactions  = useTransactionStore((s) => s.reset)
  const resetNotifications = useNotificationStore((s) => s.reset)
  const resetProfile       = useProfileStore((s) => s.reset)
  const resetSettings      = useSettingStore((s) => s.reset)
  const resetSavings       = useSavingsStore((s) => s.reset)
  const resetBudget        = useBudgetStore((s) => s.reset)

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
        if (_event === "SIGNED_OUT") {
          resetAccounts()
          resetFamily()
          resetTransactions()
          resetNotifications()
          resetProfile()
          resetSettings()
          resetSavings()
          resetBudget()
        }

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
  }, [resetAccounts, resetFamily, resetTransactions, resetNotifications, resetProfile, resetSettings, resetSavings, resetBudget])

  return { user, session, loading }
}