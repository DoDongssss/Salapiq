import { create } from "zustand"
import { supabase } from "@/lib/supabaseClient"
import type { User, Session } from "@supabase/supabase-js"

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  setSession: (session: Session | null) => void
  init: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  setSession: (session) =>
    set((state) => {
      if (state.session?.access_token === session?.access_token) return state
      return {
        session,
        user: session?.user ?? null,
      }
    }),

  init: async () => {
    const { data } = await supabase.auth.getSession()

    set({
      session: data.session,
      user: data.session?.user ?? null,
      loading: false,
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      set((state) => {
        if (state.session?.access_token === session?.access_token) return state
        return {
          session,
          user: session?.user ?? null,
        }
      })
    })
  },
}))