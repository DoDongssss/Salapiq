import { create } from "zustand"
import { supabase } from "@/lib/supabaseClient"
import type { Account } from "@/types/AccountTypes"

interface AccountState {
  accounts:     Account[]
  loading:      boolean
  initialized:  boolean
  lastAdded:    number       

  totalBalance: () => number

  fetch:       (userId: string) => Promise<void>
  refresh:     (userId: string) => Promise<void>
  reset:       () => void
  notifyAdded: () => void     
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts:    [],
  loading:     false,
  initialized: false,
  lastAdded:   0,           

  totalBalance: () =>
    get().accounts.reduce((sum, a) => sum + a.balance, 0),

  fetch: async (userId: string) => {
    if (get().initialized) return
    set({ loading: true })

    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: true })

    if (!error && data) {
      set({ accounts: data as Account[], initialized: true })
    }

    set({ loading: false })
  },

  refresh: async (userId: string) => {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: true })

    if (!error && data) {
      set({ accounts: data as Account[] })
    }
  },

  reset: () => set({ accounts: [], loading: false, initialized: false, lastAdded: 0 }),

  notifyAdded: () => set({ lastAdded: Date.now() }),  // ✅
}))