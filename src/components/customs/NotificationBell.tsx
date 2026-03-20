import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabaseClient"
import { useNotificationStore } from "@/stores/useNotificationStore"
import type { Notification } from "@/services/NotificationService"
import {
  Bell, X, Check, CheckCheck, Trash2,
  TrendingDown, Users, Wallet, Info,
} from "lucide-react"
import { cn } from "@/lib/utils"

const TYPE_ICONS = {
  transaction: TrendingDown,
  budget:      Wallet,
  family:      Users,
  system:      Info,
}

const TYPE_COLORS = {
  transaction: "bg-red-50 text-red-500",
  budget:      "bg-amber-50 text-amber-500",
  family:      "bg-emerald-50 text-emerald-600",
  system:      "bg-sky-50 text-sky-500",
}

function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)

  if (mins < 1)   return "just now"
  if (mins < 60)  return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7)   return `${days}d ago`
  return new Date(dateStr).toLocaleDateString("en-PH", { month: "short", day: "numeric" })
}

export default function NotificationBell() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const dropRef   = useRef<HTMLDivElement>(null)

  const notifications  = useNotificationStore((s) => s.notifications)
  const loading        = useNotificationStore((s) => s.loading)
  const unreadCount    = useNotificationStore((s) => s.unreadCount)
  const fetch          = useNotificationStore((s) => s.fetch)
  // const refresh        = useNotificationStore((s) => s.refresh)
  const markRead       = useNotificationStore((s) => s.markRead)
  const markAllRead    = useNotificationStore((s) => s.markAllRead)
  const remove         = useNotificationStore((s) => s.remove)
  const clearAll       = useNotificationStore((s) => s.clearAll)
  const prepend        = useNotificationStore((s) => s.prepend)

  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (user) fetch(user.id)
  }, [user, fetch])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event:  "INSERT",
          schema: "public",
          table:  "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          prepend(payload.new as Notification)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, prepend])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const handleClick = async (n: Notification) => {
    if (!n.read) await markRead(n.id)
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  const unread = unreadCount()

  return (
    <div ref={dropRef} className="relative">

      <button
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
          open
            ? "bg-stone-100 text-stone-700"
            : "text-stone-400 hover:text-stone-700 hover:bg-stone-50"
        )}
      >
        <Bell size={15} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[14px] h-[14px] rounded-full bg-emerald-500 flex items-center justify-center">
            <span className="mono text-[8px] font-semibold text-white leading-none px-0.5">
              {unread > 9 ? "9+" : unread}
            </span>
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-10 w-80 bg-white rounded-2xl border border-stone-200 shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden z-50"
          style={{ animation: "dropIn 0.15s cubic-bezier(0.22,1,0.36,1) both" }}
        >
          <style>{`
            @keyframes dropIn {
              from { opacity: 0; transform: translateY(-6px) scale(0.98); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>

          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold text-stone-900">Notifications</p>
              {unread > 0 && (
                <span className="mono text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                  {unread} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={() => user && markAllRead(user.id)}
                  className="flex items-center gap-1 mono text-[10px] text-stone-400 hover:text-emerald-600 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors"
                >
                  <CheckCheck size={11} /> All read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => user && clearAll(user.id)}
                  className="flex items-center gap-1 mono text-[10px] text-stone-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={11} /> Clear
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <div className="flex flex-col gap-0">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-stone-50 animate-pulse">
                    <div className="w-8 h-8 bg-stone-100 rounded-xl shrink-0" />
                    <div className="flex-1">
                      <div className="h-2.5 w-28 bg-stone-100 rounded mb-1.5" />
                      <div className="h-2 w-40 bg-stone-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={24} className="text-stone-200 mx-auto mb-2" />
                <p className="mono text-[11px] text-stone-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = TYPE_ICONS[n.type]
                return (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3 border-b border-stone-50 last:border-0 cursor-pointer transition-colors group",
                      n.read ? "hover:bg-stone-50/60" : "bg-emerald-50/30 hover:bg-emerald-50/60"
                    )}
                  >
                    <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5", TYPE_COLORS[n.type])}>
                      <Icon size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-[12px] leading-tight",
                          n.read ? "text-stone-600 font-normal" : "text-stone-900 font-medium"
                        )}>
                          {n.title}
                        </p>
                        <div className="flex items-center gap-1 shrink-0">
                          {!n.read && (
                            <button
                              onClick={async (e) => { e.stopPropagation(); await markRead(n.id) }}
                              className="w-5 h-5 rounded flex items-center justify-center text-stone-300 hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Check size={10} />
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); remove(n.id) }}
                            className="w-5 h-5 rounded flex items-center justify-center text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      </div>
                      <p className="mono text-[10px] text-stone-400 mt-0.5 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                      <p className="mono text-[9px] text-stone-300 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}