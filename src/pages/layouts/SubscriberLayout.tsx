import { useState, useEffect } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useSessionTimeout } from "@/hooks/useSessionTimeout"
import { logout } from "@/services/AuthService"
import { useAccountStore }      from "@/stores/useAccountStore"
import { useFamilyStore }       from "@/stores/useFamilyStore"
import { useTransactionStore }  from "@/stores/useTransactionStore"
import { useNotificationStore } from "@/stores/useNotificationStore"
import { useProfileStore }      from "@/stores/useProfileStore"
import { useSettingStore } from "@/stores/useSettingStore"
import {
  LayoutDashboard, ListChecks, Target,
  PiggyBank, Sparkles, Plus, LogOut,
  Settings, Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import logo from "@/assets/logo.png"
import AddExpenseModal  from "@/components/modals/AddExpenseModal"
import NotificationBell from "@/components/customs/NotificationBell"

const CURRENT_MONTH = new Date().getMonth() + 1
const CURRENT_YEAR  = new Date().getFullYear()

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard",    path: "/app/dashboard"    },
  { icon: ListChecks,      label: "Ledger",       path: "/app/ledger" },
  // { icon: Wallet,          label: "Accounts",     path: "/app/accounts"     },
  // { icon: ListChecks,      label: "Transactions", path: "/app/transactions" },
  { icon: Target,          label: "Budget",       path: "/app/budget"       },
  { icon: PiggyBank,       label: "Savings",      path: "/app/savings"      },
  { icon: Users,           label: "Family",       path: "/app/family"       },
  { icon: Sparkles,        label: "AI Classify",  path: "/app/classify"     },
  { icon: Settings,        label: "Settings",     path: "/app/settings"     },
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

  const [showAddExpense, setShowAddExpense] = useState(false)

  useSessionTimeout()

  useEffect(() => {
    if (!user) return
    fetchAccounts(user.id)
    fetchFamily(user.id)
    fetchSummary(user.id, CURRENT_MONTH, CURRENT_YEAR)
    fetchNotifications(user.id)
    fetchProfile(user.id)
    fetchSettings(user.id)
  }, [user, fetchAccounts, fetchFamily, fetchSummary, fetchNotifications, fetchProfile, fetchSettings])

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth/login", { replace: true })
    }
  }, [user, loading, navigate])

  if (loading) return null

  const handleLogout = async () => {
    resetAccounts()
    resetFamily()
    resetTransactions()
    resetNotifications()
    resetProfile()
    resetSettings()
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

  return (
    <div className="min-h-screen bg-[#f7f5f0] font-['Bricolage_Grotesque',sans-serif]">

      <nav className="sticky top-0 z-40 bg-white border-b border-stone-200/80 shadow-[0_1px_12px_rgba(0,0,0,0.04)]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">

          <div className="flex items-center gap-2 mr-4 shrink-0">
            <img src={logo} alt="Salapiq" className="h-10 w-auto object-contain" />
          </div>

          <div className="flex items-center gap-0.5 flex-1">
            {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
              const active = location.pathname.startsWith(path)
              return (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150",
                    active
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"
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
              onClick={() => setShowAddExpense(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-medium transition-colors"
            >
              <Plus size={12} />
              Add expense
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-stone-100">
              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="mono text-[10px] font-medium text-emerald-700">{initials}</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-[11px] font-medium text-stone-700 leading-none">
                  {user?.email?.split("@")[0]}
                </p>
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

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Outlet />
      </main>

      <AddExpenseModal
        open={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        onAdded={handleTransactionAdded}
      />
    </div>
  )
}