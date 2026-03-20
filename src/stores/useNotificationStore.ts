import { create } from "zustand"
import {
  getNotifications, markAsRead, markAllAsRead,
  deleteNotification, clearAllNotifications,
  type Notification,
} from "@/services/NotificationService"

interface NotificationState {
  notifications: Notification[]
  loading:       boolean
  initialized:   boolean

  unreadCount:   () => number

  fetch:         (userId: string) => Promise<void>
  refresh:       (userId: string) => Promise<void>
  markRead:      (id: string) => Promise<void>
  markAllRead:   (userId: string) => Promise<void>
  remove:        (id: string) => Promise<void>
  clearAll:      (userId: string) => Promise<void>
  prepend:       (notification: Notification) => void
  reset:         () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  loading:       false,
  initialized:   false,

  unreadCount: () => get().notifications.filter((n) => !n.read).length,

  fetch: async (userId) => {
    if (get().initialized) return
    set({ loading: true })
    const data = await getNotifications(userId)
    set({ notifications: data, initialized: true, loading: false })
  },

  refresh: async (userId) => {
    const data = await getNotifications(userId)
    set({ notifications: data })
  },

  markRead: async (id) => {
    await markAsRead(id)
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }))
  },

  markAllRead: async (userId) => {
    await markAllAsRead(userId)
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    }))
  },

  remove: async (id) => {
    await deleteNotification(id)
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    }))
  },

  clearAll: async (userId) => {
    await clearAllNotifications(userId)
    set({ notifications: [] })
  },

  prepend: (notification) => {
    set((s) => ({
      notifications: [notification, ...s.notifications].slice(0, 20),
    }))
  },

  reset: () => set({ notifications: [], loading: false, initialized: false }),
}))