import { create } from "zustand"
import { supabase } from "@/lib/supabaseClient"
import type { BudgetSummary } from "@/types/BudgetTypes"
import { getBudgetOverview } from "@/services/BudgetService"

interface BudgetState {
  budgets:      BudgetSummary[]
  month:        number
  year:         number
  loading:      boolean
  initialized:  boolean

  overview: () => ReturnType<typeof getBudgetOverview>

  fetch:   (userId: string, month: number, year: number) => Promise<void>
  refresh: (userId: string, month: number, year: number) => Promise<void>
  setMonth: (month: number, year: number) => void
  reset:   () => void
}

const now = new Date()

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets:     [],
  month:       now.getMonth() + 1,
  year:        now.getFullYear(),
  loading:     false,
  initialized: false,

  overview: () => getBudgetOverview(get().budgets),

  fetch: async (userId, month, year) => {
    if (get().initialized && get().month === month && get().year === year) return
    set({ loading: true })

    const { data, error } = await supabase
      .from("budget_summary")
      .select("*")
      .eq("user_id", userId)
      .eq("month", month)
      .eq("year",  year)
      .order("category", { ascending: true })

    if (!error && data) {
      set({ budgets: data as BudgetSummary[], month, year, initialized: true })
    }

    set({ loading: false })
  },

  refresh: async (userId, month, year) => {
    const { data, error } = await supabase
      .from("budget_summary")
      .select("*")
      .eq("user_id", userId)
      .eq("month", month)
      .eq("year",  year)
      .order("category", { ascending: true })

    if (!error && data) {
      set({ budgets: data as BudgetSummary[], month, year })
    }
  },

  setMonth: (month, year) => set({ month, year, initialized: false }),

  reset: () => set({
    budgets:     [],
    month:       new Date().getMonth() + 1,
    year:        new Date().getFullYear(),
    loading:     false,
    initialized: false,
  }),
}))