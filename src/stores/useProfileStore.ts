import { create } from "zustand"
import { getProfile, updateProfile } from "@/services/SettingsService"
import type { Profile, ProfileForm } from "@/types/SettingsTypes"

interface ProfileState {
  profile:     Profile | null
  loading:     boolean
  initialized: boolean

  fetch:     (userId: string) => Promise<void>
  refresh:   (userId: string) => Promise<void>
  update:    (userId: string, payload: ProfileForm) => Promise<string | null>
  reset:     () => void

  fullName:  () => string | null
  avatarUrl: () => string | null
  initials:  (fallback?: string) => string
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile:     null,
  loading:     false,
  initialized: false,

  fetch: async (userId) => {
    if (get().initialized) return
    set({ loading: true })
    const data = await getProfile(userId)
    set({ profile: data, initialized: true, loading: false })
  },

  refresh: async (userId) => {
    const data = await getProfile(userId)
    set({ profile: data })
  },

  update: async (userId, payload) => {
    const error = await updateProfile(userId, payload)
    if (!error) {
      set((s) => ({
        profile: s.profile
          ? {
              ...s.profile,
              full_name:      payload.full_name,
              username:       payload.username       ?? s.profile.username,
              phone:          payload.phone          ?? s.profile.phone,
              monthly_income: payload.monthly_income ?? s.profile.monthly_income,
              currency:       payload.currency,
              timezone:       payload.timezone,
            }
          : s.profile,
      }))
    }
    return error
  },

  reset: () => set({ profile: null, loading: false, initialized: false }),

  fullName:  () => get().profile?.full_name ?? null,
  avatarUrl: () => get().profile?.avatar_url ?? null,
  initials:  (fallback = "SA") => {
    const name = get().profile?.full_name || fallback
    return name.slice(0, 2).toUpperCase()
  },
}))