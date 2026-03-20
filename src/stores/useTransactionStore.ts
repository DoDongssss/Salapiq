import { create } from "zustand"
import { supabase } from "@/lib/supabaseClient"

type Summary = { income: number; expenses: number; net: number }

interface TransactionState {
  summary:      Summary
  lastAdded:    number
  initialized:  boolean

  setSummary:   (summary: Summary) => void
  notifyAdded:  () => void
  fetchSummary: (userId: string, month: number, year: number) => Promise<void>
  reset:        () => void
}

const DEFAULT_SUMMARY: Summary = { income: 0, expenses: 0, net: 0 }

export const useTransactionStore = create<TransactionState>((set) => ({
  summary:     DEFAULT_SUMMARY,
  lastAdded:   0,
  initialized: false,

  setSummary:  (summary) => set({ summary }),

  notifyAdded: () => set({ lastAdded: Date.now() }),

  fetchSummary: async (userId, month, year) => {
    const from = `${year}-${String(month).padStart(2, "0")}-01`
    const to   = new Date(year, month, 0).toISOString().split("T")[0]

    const { data } = await supabase
      .from("transactions")
      .select("amount, type")
      .eq("user_id", userId)
      .neq("type", "transfer")
      .gte("date", from)
      .lte("date", to)

    if (!data) return

    const income   = data.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
    const expenses = data.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)

    set({ summary: { income, expenses, net: income - expenses }, initialized: true })
  },

  reset: () => set({ summary: DEFAULT_SUMMARY, lastAdded: 0, initialized: false }),
}))