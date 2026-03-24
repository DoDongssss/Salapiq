import { useState, useEffect, useRef } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useSessionTimeout } from "@/hooks/useSessionTimeout"
import { logout } from "@/services/AuthService"
import { useAccountStore }      from "@/stores/useAccountStore"
import { useFamilyStore }       from "@/stores/useFamilyStore"
import { useTransactionStore }  from "@/stores/useTransactionStore"
import { useNotificationStore } from "@/stores/useNotificationStore"
import { useProfileStore }      from "@/stores/useProfileStore"
import { useSettingStore }      from "@/stores/useSettingStore"
import { useSavingsStore }      from "@/stores/useSavingsStore"
import { useBudgetStore }       from "@/stores/useBudgetStore"
import {
  LayoutDashboard, ListChecks, Target,
  PiggyBank, Sparkles, Plus, LogOut,
  Settings, Users, RefreshCw, Menu, X,
  ArrowRight, Minus
} from "lucide-react"
import { cn } from "@/lib/utils"
import logo from "@/assets/logo.png"
import AddExpenseModal  from "@/components/modals/AddExpenseModal"
import NotificationBell from "@/components/customs/NotificationBell"

const CURRENT_MONTH = new Date().getMonth() + 1
const CURRENT_YEAR  = new Date().getFullYear()

const DESKTOP_NAV = [
  { icon: LayoutDashboard, label: "Dashboard",  path: "/app/dashboard"   },
  { icon: ListChecks,      label: "Ledger",     path: "/app/ledger"      },
  { icon: Target,          label: "Budget",     path: "/app/budget"      },
  { icon: PiggyBank,       label: "Savings",    path: "/app/savings"     },
  { icon: RefreshCw,       label: "Recurring",  path: "/app/recurring"   },
  { icon: Users,           label: "Family",     path: "/app/family"      },
  { icon: Sparkles,        label: "Classify",   path: "/app/ai-classify" },
  { icon: Settings,        label: "Settings",   path: "/app/settings"    },
]

export default function SubscriberLayout() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user, loading } = useAuth()

  const fetchAccounts      = useAccountStore((s) => s.fetch)
  const refreshAccounts    = useAccountStore((s) => s.refresh)
  const resetAccounts      = useAccountStore((s) => s.reset)
  const notifyAdded        = useAccountStore((s) => s.notifyAdded)
  const fetchFamily        = useFamilyStore((s) => s.fetch)
  const resetFamily        = useFamilyStore((s) => s.reset)
  const fetchSummary       = useTransactionStore((s) => s.fetchSummary)
  const notifyTransaction  = useTransactionStore((s) => s.notifyAdded)
  const resetTransactions  = useTransactionStore((s) => s.reset)
  const fetchNotifications = useNotificationStore((s) => s.fetch)
  const resetNotifications = useNotificationStore((s) => s.reset)
  const fetchProfile       = useProfileStore((s) => s.fetch)
  const profileInitials    = useProfileStore((s) => s.initials)
  const resetProfile       = useProfileStore((s) => s.reset)
  const fetchSettings      = useSettingStore((s) => s.fetch)
  const resetSettings      = useSettingStore((s) => s.reset)
  const fetchSavings       = useSavingsStore((s) => s.fetch)
  const resetSavings       = useSavingsStore((s) => s.reset)
  const fetchBudget        = useBudgetStore((s) => s.fetch)
  const resetBudget        = useBudgetStore((s) => s.reset)

  const [showAddExpense,   setShowAddExpense]   = useState(false)
  const [transactionType,  setTransactionType]  = useState<"expense" | "income" | "transfer">("expense")
  const [drawerOpen,       setDrawerOpen]       = useState(false)
  const [fabOpen,          setFabOpen]          = useState(false)

  const openModal = (type: "expense" | "income" | "transfer") => {
    setTransactionType(type)
    setShowAddExpense(true)
    setFabOpen(false)
  }

  const dragStartX   = useRef<number | null>(null)
  const dragCurrentX = useRef<number | null>(null)
  const drawerRef    = useRef<HTMLElement | null>(null)

  useSessionTimeout()

  useEffect(() => {
    if (!user) return
    fetchAccounts(user.id)
    fetchFamily(user.id)
    fetchSummary(user.id, CURRENT_MONTH, CURRENT_YEAR)
    fetchNotifications(user.id)
    fetchProfile(user.id)
    fetchSettings(user.id)
    fetchSavings(user.id)
    fetchBudget(user.id, CURRENT_MONTH, CURRENT_YEAR)
  }, [user, fetchAccounts, fetchFamily, fetchSummary, fetchNotifications, fetchProfile, fetchSettings, fetchSavings, fetchBudget])

  useEffect(() => {
    if (!loading && !user) navigate("/auth/login", { replace: true })
  }, [user, loading, navigate])

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow    = "hidden"
      document.body.style.touchAction = "none"
    } else {
      document.body.style.overflow    = ""
      document.body.style.touchAction = ""
    }
    return () => {
      document.body.style.overflow    = ""
      document.body.style.touchAction = ""
    }
  }, [drawerOpen])

  useEffect(() => {
    if (!fabOpen) return
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest("[data-fab]")) setFabOpen(false)
    }
    document.addEventListener("mousedown", handler)
    document.addEventListener("touchstart", handler)
    return () => {
      document.removeEventListener("mousedown", handler)
      document.removeEventListener("touchstart", handler)
    }
  }, [fabOpen])

  if (loading) return null

  const handleLogout = async () => {
    resetAccounts(); resetFamily(); resetTransactions()
    resetNotifications(); resetProfile(); resetSettings()
    resetSavings(); resetBudget()
    await logout()
    navigate("/auth/login", { replace: true })
  }

  const handleTransactionAdded = () => {
    if (user) {
      refreshAccounts(user.id)
      fetchSummary(user.id, CURRENT_MONTH, CURRENT_YEAR)
    }
    notifyAdded()
    notifyTransaction()
  }

  const initials = profileInitials(user?.email?.slice(0, 2).toUpperCase() ?? "SA")

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartX.current = e.touches[0].clientX
  }
  const handleTouchMove = (e: React.TouchEvent) => {
    dragCurrentX.current = e.touches[0].clientX
    const delta = dragCurrentX.current - (dragStartX.current ?? 0)
    if (delta > 0 && drawerRef.current) {
      drawerRef.current.style.transform  = `translateX(${delta}px)`
      drawerRef.current.style.transition = "none"
    }
  }
  const handleTouchEnd = () => {
    const delta = (dragCurrentX.current ?? 0) - (dragStartX.current ?? 0)
    if (drawerRef.current) {
      drawerRef.current.style.transform  = ""
      drawerRef.current.style.transition = ""
    }
    if (delta > 80) setDrawerOpen(false)
    dragStartX.current   = null
    dragCurrentX.current = null
  }

  return (
    <div className="min-h-screen bg-[#f7f5f0] font-['Bricolage_Grotesque',sans-serif]">

      <nav className="sticky top-0 z-40 bg-white border-b border-stone-200/80 shadow-[0_1px_12px_rgba(0,0,0,0.04)] hidden md:block">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
          <div className="flex items-center gap-2 mr-4 shrink-0">
            <img src={logo} alt="Salapiq" className="h-10 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-0.5 flex-1">
            {DESKTOP_NAV.map(({ icon: Icon, label, path }) => {
              const active = location.pathname.startsWith(path)
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150",
                    active ? "bg-emerald-50 text-emerald-700" : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"
                  )}
                >
                  <Icon size={13} />
                  {label}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <NotificationBell />
            <button
              onClick={() => openModal("expense")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-medium transition-colors"
            >
              <Plus size={12} /> Add expense
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-stone-100">
              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="mono text-[10px] font-medium text-emerald-700">{initials}</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-[11px] font-medium text-stone-700 leading-none">{user?.email?.split("@")[0]}</p>
                <p className="mono text-[9px] text-stone-400 mt-0.5">subscriber</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-300 hover:text-red-400 hover:bg-red-50 transition-colors ml-1"
                title="Sign out"
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-stone-200/80 shadow-[0_1px_12px_rgba(0,0,0,0.04)]">
        <div className="h-[env(safe-area-inset-top,0px)] bg-white" />
        <div className="h-14 px-4 flex items-center justify-between relative">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-500 hover:bg-stone-100 active:bg-stone-200 transition-colors"
          >
            <Menu size={20} />
          </button>
          <img src={logo} alt="Salapiq" className="h-8 w-auto object-contain absolute left-1/2 -translate-x-1/2" />
          <div className="flex items-center gap-1">
            <NotificationBell />
          </div>
        </div>
      </header>

      <div
        onClick={() => setDrawerOpen(false)}
        className={cn(
          "md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300",
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      <aside
        ref={drawerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "md:hidden fixed top-0 left-0 z-50 h-full w-[280px] bg-white flex flex-col",
          "shadow-[4px_0_32px_rgba(0,0,0,0.12)] rounded-r-[24px]",
          "transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-[env(safe-area-inset-top,0px)]" />
        <div className="h-14 px-5 flex items-center justify-between shrink-0">
          <img src={logo} alt="Salapiq" className="h-8 w-auto object-contain" />
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-stone-100 text-stone-500 active:bg-stone-200"
          >
            <X size={15} />
          </button>
        </div>

        <div className="mx-4 mb-4 px-3 py-3 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-semibold text-white">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-stone-800 truncate">{user?.email?.split("@")[0]}</p>
            <p className="text-[10px] text-emerald-600 font-medium">Subscriber</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {[
            {
              heading: "Main",
              items: [
                { icon: LayoutDashboard, label: "Dashboard",  path: "/app/dashboard"   },
                { icon: ListChecks,      label: "Ledger",     path: "/app/ledger"      },
                { icon: Target,          label: "Budget",     path: "/app/budget"      },
                { icon: PiggyBank,       label: "Savings",    path: "/app/savings"     },
                { icon: Users,           label: "Family",     path: "/app/family"      },
              ],
            },
            {
              heading: "Tools",
              items: [
                { icon: RefreshCw,  label: "Recurring",   path: "/app/recurring"   },
                { icon: Sparkles,   label: "AI Classify", path: "/app/ai-classify" },
              ],
            },
            {
              heading: "Account",
              items: [
                { icon: Settings, label: "Settings", path: "/app/settings" },
              ],
            },
          ].map(({ heading, items }) => (
            <div key={heading} className="mb-4">
              <p className="px-2 mb-1.5 text-[10px] font-semibold text-stone-400 uppercase tracking-wider">{heading}</p>
              <ul className="space-y-0.5">
                {items.map(({ icon: Icon, label, path }) => {
                  const active = location.pathname.startsWith(path)
                  return (
                    <li key={path}>
                      <button
                        onClick={() => { navigate(path); setDrawerOpen(false) }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all active:scale-[0.98]",
                          active ? "bg-emerald-50 text-emerald-700" : "text-stone-600 hover:bg-stone-50 active:bg-stone-100"
                        )}
                      >
                        <span className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                          active ? "bg-emerald-100" : "bg-stone-100"
                        )}>
                          <Icon size={15} className={active ? "text-emerald-600" : "text-stone-500"} />
                        </span>
                        {label}
                        {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="px-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] shrink-0">
          <div className="h-px bg-stone-100 mb-3" />
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[13px] font-medium text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors"
          >
            <span className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <LogOut size={15} className="text-red-400" />
            </span>
            Sign out
          </button>
        </div>
      </aside>

      <main className={cn(
        "max-w-6xl mx-auto px-4 sm:px-6 py-5 md:py-8",
        "pb-[calc(100px+env(safe-area-inset-bottom,0px))] md:pb-8"
      )}>
        <Outlet />
      </main>

      <div
        data-fab
        className={cn(
          "md:hidden fixed bottom-0 right-0 z-50",
          "pb-[calc(24px+env(safe-area-inset-bottom,0px))] pr-5",
          "flex flex-col items-end gap-3"
        )}
      >
        <div
          onClick={() => setFabOpen(false)}
          className={cn(
            "fixed inset-0 -z-10 bg-black/30 backdrop-blur-[1.5px] transition-all duration-300",
            fabOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
        />

        <div className={cn(
          "flex flex-col items-end gap-2.5 transition-all duration-300 origin-bottom",
          fabOpen ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95 pointer-events-none"
        )}>
          <div className="flex items-center gap-2.5">
            <span className="bg-white text-stone-700 text-[12px] font-medium px-3 py-1.5 rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.12)]">
              Transfer
            </span>
            <button
              onClick={() => openModal("transfer")}
              className="w-11 h-11 rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.14)] flex items-center justify-center active:scale-95 transition-transform"
            >
              <ArrowRight size={16} className="text-sky-500" />
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="bg-white text-stone-700 text-[12px] font-medium px-3 py-1.5 rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.12)]">
              Add income
            </span>
            <button
              onClick={() => openModal("income")}
              className="w-11 h-11 rounded-full bg-emerald-50 shadow-[0_2px_12px_rgba(0,0,0,0.10)] flex items-center justify-center active:scale-95 transition-transform"
            >
              <Plus size={16} className="text-emerald-600" />
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="bg-white text-stone-700 text-[12px] font-medium px-3 py-1.5 rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.12)]">
              Add expense
            </span>
            <button
              onClick={() => openModal("expense")}
              className="w-11 h-11 rounded-full bg-red-50 shadow-[0_2px_12px_rgba(0,0,0,0.10)] flex items-center justify-center active:scale-95 transition-transform"
            >
              <Minus size={16} className="text-red-500" />
            </button>
          </div>
        </div>

        <button
          data-fab
          onClick={() => setFabOpen((v) => !v)}
          className={cn(
            "w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center",
            "shadow-[0_4px_20px_rgba(5,150,105,0.4)]",
            "active:scale-95 transition-all duration-300",
            fabOpen && "rotate-45 bg-emerald-700 shadow-[0_4px_20px_rgba(5,150,105,0.25)]"
          )}
          aria-label="Add transaction"
        >
          <Plus
            size={24}
            strokeWidth={2.5}
            className="text-white transition-transform duration-300"
          />
        </button>
      </div>

      <AddExpenseModal
        open={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        onAdded={handleTransactionAdded}
        transactionType={transactionType}
      />
    </div>
  )
}