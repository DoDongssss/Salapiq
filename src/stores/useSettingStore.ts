import { create } from "zustand"
import {
  getUserSettings, updateUserSettings,
  updateAppPreferences, saveNotificationPrefs,
  extractNotificationPrefs,
} from "@/services/SettingsService"
import type { UserSettingsRow, NotificationPrefs } from "@/types/SettingsTypes"

interface useSettingState {
  settings:    UserSettingsRow | null
  loading:     boolean
  initialized: boolean

  theme:      string
  language:   string
  dateFormat: string
  aiOptIn:    boolean
  notifs:     NotificationPrefs

  fetch:         (userId: string) => Promise<void>
  refresh:       (userId: string) => Promise<void>
  updatePrefs:   (userId: string, prefs: { theme?: string; language?: string; date_format?: string }) => Promise<string | null>
  updateNotifs:  (userId: string, notifs: NotificationPrefs) => Promise<string | null>
  updateAiOptIn: (userId: string, value: boolean) => Promise<string | null>
  reset:         () => void
}

const DEFAULT_NOTIFS: NotificationPrefs = {
  weeklyReport:  true,
  budgetAlerts:  true,
  goalReminders: true,
  loginAlerts:   true,
}

export const useSettingStore = create<useSettingState>((set, get) => ({
  settings:    null,
  loading:     false,
  initialized: false,

  theme:      "light",
  language:   "en",
  dateFormat: "MM/DD/YYYY",
  aiOptIn:    true,
  notifs:     DEFAULT_NOTIFS,

  fetch: async (userId) => {
    if (get().initialized) return
    set({ loading: true })
    const data = await getUserSettings(userId)
    if (data) {
      set({
        settings:    data,
        theme:       data.theme        ?? "light",
        language:    data.language     ?? "en",
        dateFormat:  data.date_format  ?? "MM/DD/YYYY",
        aiOptIn:     data.ai_opt_in    ?? true,
        notifs:      extractNotificationPrefs(data),
        initialized: true,
      })
    } else {
      set({ initialized: true })
    }
    set({ loading: false })
  },

  refresh: async (userId) => {
    const data = await getUserSettings(userId)
    if (data) {
      set({
        settings:   data,
        theme:      data.theme        ?? "light",
        language:   data.language     ?? "en",
        dateFormat: data.date_format  ?? "MM/DD/YYYY",
        aiOptIn:    data.ai_opt_in    ?? true,
        notifs:     extractNotificationPrefs(data),
      })
    }
  },

  updatePrefs: async (userId, prefs) => {
    const error = await updateAppPreferences(userId, prefs)
    if (!error) {
      set((s) => ({
        theme:      prefs.theme       ?? s.theme,
        language:   prefs.language    ?? s.language,
        dateFormat: prefs.date_format ?? s.dateFormat,
      }))
    }
    return error
  },

  updateNotifs: async (userId, notifs) => {
    const error = await saveNotificationPrefs(userId, notifs)
    if (!error) set({ notifs })
    return error
  },

  updateAiOptIn: async (userId, value) => {
    const error = await updateUserSettings(userId, { ai_opt_in: value })
    if (!error) set({ aiOptIn: value })
    return error
  },

  reset: () => set({
    settings:    null,
    loading:     false,
    initialized: false,
    theme:       "light",
    language:    "en",
    dateFormat:  "MM/DD/YYYY",
    aiOptIn:     true,
    notifs:      DEFAULT_NOTIFS,
  }),
}))