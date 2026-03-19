import { useState, useEffect } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useSessionTimeout } from "@/hooks/useSessionTimeout"
import { logout } from "@/services/AuthService"
import {
  LayoutDashboard, ListChecks, Target,
  PiggyBank, Sparkles, Bell, Plus, LogOut,
  Settings, Wallet, Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import logo from "@/assets/logo.png"
import AddExpenseModal from "@/components/modals/AddExpenseModal"

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard",    path: "/app/dashboard"    },
  { icon: Wallet,          label: "Accounts",     path: "/app/accounts"     },
  { icon: ListChecks,      label: "Transactions", path: "/app/transactions" },
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

  const [showAddExpense, setShowAddExpense] = useState(false)

  useSessionTimeout()

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth/login", { replace: true })
    }
  }, [user, loading, navigate])

  if (loading) return null

  const handleLogout = async () => {
    await logout()
    navigate("/auth/login", { replace: true })
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "SA"

  return (
    <div className="min-h-screen bg-[#f7f5f0] font-['Bricolage_Grotesque',sans-serif]">

      {/* ── Top navigation ── */}
      <nav className="sticky top-0 z-40 bg-white border-b border-stone-200/80 shadow-[0_1px_12px_rgba(0,0,0,0.04)]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2 mr-4 shrink-0">
            <img src={logo} alt="Salapiq" className="h-10 w-auto object-contain" />
          </div>

          {/* Nav items */}
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

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">

            {/* Notification bell */}
            <button className="relative w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors">
              <Bell size={15} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </button>

            {/* ✅ Add expense — opens global modal */}
            <button
              onClick={() => setShowAddExpense(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-medium transition-colors"
            >
              <Plus size={12} />
              Add expense
            </button>

            {/* User + logout */}
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

      {/* ── Page content ── */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Outlet />
      </main>

      {/* ── Global Add Expense Modal ── */}
      <AddExpenseModal
        open={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        onAdded={() => {
          // If user is on transactions page, it will auto-refresh
          // via its own useEffect when navigating back or re-focusing
        }}
      />
    </div>
  )
}