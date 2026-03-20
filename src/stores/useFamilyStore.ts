import { create } from "zustand"
import {
  getMyFamily, getFamilyWithMembers,
  type FamilyWithMembers,
} from "@/services/FamilyService"

interface FamilyState {
  family:      FamilyWithMembers | null
  loading:     boolean
  initialized: boolean

  fetch:    (userId: string) => Promise<void>
  refresh:  (userId: string) => Promise<void>
  reset:    () => void
  myRole:   (userId: string) => "admin" | "member" | undefined
  familyId: () => string | null
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  family:      null,
  loading:     false,
  initialized: false,

  fetch: async (userId) => {
    if (get().initialized) return
    set({ loading: true })
    const base = await getMyFamily(userId)
    if (base) {
      const full = await getFamilyWithMembers(base.id)
      set({ family: full, initialized: true })
    } else {
      set({ family: null, initialized: true })
    }
    set({ loading: false })
  },

  refresh: async (userId) => {
    const base = await getMyFamily(userId)
    if (base) {
      const full = await getFamilyWithMembers(base.id)
      set({ family: full })
    } else {
      set({ family: null })
    }
  },

  reset:    () => set({ family: null, loading: false, initialized: false }),
  myRole:   (userId) => get().family?.members.find((m) => m.user_id === userId)?.role,
  familyId: () => get().family?.id ?? null,
}))