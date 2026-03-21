import { create } from "zustand"
import { getGoals, getContributions, getSavingsOverview } from "@/services/SavingsService"
import type { SavingsGoal, GoalContribution } from "@/types/SavingsTypes"

interface SavingsState {
  goals:         SavingsGoal[]
  loading:       boolean
  initialized:   boolean
  familyId:      string | undefined

  contributions:        Record<string, GoalContribution[]>
  contributionsLoading: Record<string, boolean>

  overview:            () => ReturnType<typeof getSavingsOverview>
  fetch:               (userId: string, familyId?: string) => Promise<void>
  refresh:             (userId: string, familyId?: string) => Promise<void>
  fetchContributions:  (goalId: string) => Promise<void>
  refreshContributions:(goalId: string) => Promise<void>
  reset:               () => void
}

export const useSavingsStore = create<SavingsState>((set, get) => ({
  goals:                [],
  loading:              false,
  initialized:          false,
  familyId:             undefined,
  contributions:        {},
  contributionsLoading: {},

  overview: () => getSavingsOverview(get().goals),

  fetch: async (userId, familyId) => {
    const state = get()
    if (state.initialized && state.familyId === familyId) return
    set({ loading: true })
    const data = await getGoals(userId, familyId)
    set({ goals: data, initialized: true, loading: false, familyId })
  },

  refresh: async (userId, familyId) => {
    set({ loading: true })
    const data = await getGoals(userId, familyId)
    set({ goals: data, familyId, loading: false, initialized: true })
  },

  fetchContributions: async (goalId) => {
    if (get().contributions[goalId]) return  
    set((s) => ({ contributionsLoading: { ...s.contributionsLoading, [goalId]: true } }))
    const data = await getContributions(goalId)
    set((s) => ({
      contributions:        { ...s.contributions,        [goalId]: data  },
      contributionsLoading: { ...s.contributionsLoading, [goalId]: false },
    }))
  },

  refreshContributions: async (goalId) => {
    set((s) => ({ contributionsLoading: { ...s.contributionsLoading, [goalId]: true } }))
    const data = await getContributions(goalId)
    set((s) => ({
      contributions:        { ...s.contributions,        [goalId]: data  },
      contributionsLoading: { ...s.contributionsLoading, [goalId]: false },
    }))
  },

  reset: () => set({
    goals:                [],
    loading:              false,
    initialized:          false,
    familyId:             undefined,
    contributions:        {},
    contributionsLoading: {},
  }),
}))