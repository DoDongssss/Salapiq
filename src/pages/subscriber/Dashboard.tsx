import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { useAccountStore }      from "@/stores/useAccountStore"
import { useTransactionStore }  from "@/stores/useTransactionStore"
import { useFamilyStore }       from "@/stores/useFamilyStore"
import { useSavingsStore }      from "@/stores/useSavingsStore"
import { useProfileStore }      from "@/stores/useProfileStore"
import { useNotificationStore } from "@/stores/useNotificationStore"
import { useBudgetStore }       from "@/stores/useBudgetStore"
import { getBudgetStatus }      from "@/types/BudgetTypes"
import { STATUS_COLORS }        from "@/config/subscriber"
import {
  TrendingUp, TrendingDown, ArrowLeftRight,
  Wallet, Users, PiggyBank, Sparkles,
  ChevronRight, AlertTriangle, Lightbulb,
  Target, Building2, CreditCard, Smartphone,
  ArrowUpRight, ArrowDownRight, CircleDollarSign,
} from "lucide-react"
import { cn } from "@/lib/utils"

const CURRENT_MONTH = new Date().toLocaleString("en-PH", { month: "long" })
const CURRENT_YEAR  = new Date().getFullYear()

const AI_INSIGHTS = [
  {
    id:    1,
    icon:  AlertTriangle,
    color: "text-amber-500 bg-amber-50 border-amber-200",
    title: "Food spending up 32%",
    desc:  "₱4,200 spent this month — 32% above your average.",
  },
  {
    id:    2,
    icon:  Lightbulb,
    color: "text-sky-500 bg-sky-50 border-sky-200",
    title: "Best saving day: Tuesday",
    desc:  "You spend the least on Tuesdays. Schedule transfers then.",
  },
  {
    id:    3,
    icon:  Target,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    title: "Emergency Fund on track",
    desc:  "At this pace, goal reached 3 weeks early. Keep going!",
  },
]

const ACCOUNT_ICONS: Record<string, typeof Wallet> = {
  bank:    Building2,
  debit:   CreditCard,
  ewallet: Smartphone,
  cash:    Wallet,
}

const CATEGORY_ICONS: Record<string, string> = {
  "Food & Dining":  "🍜",
  "Transportation": "🚌",
  "Shopping":       "🛒",
  "Entertainment":  "🎬",
  "Health":         "💊",
  "Education":      "📚",
  "Bills":          "🧾",
  "Travel":         "✈️",
  "Personal Care":  "💄",
  "Other":          "📦",
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const accounts      = useAccountStore((s) => s.accounts)
  const totalBalance  = useAccountStore((s) => s.totalBalance)
  const summary       = useTransactionStore((s) => s.summary)
  const family        = useFamilyStore((s) => s.family)
  const goals         = useSavingsStore((s) => s.goals)
  const savingsOv     = useSavingsStore((s) => s.overview)
  const fullName      = useProfileStore((s) => s.fullName)
  const notifications = useNotificationStore((s) => s.notifications)
  const unreadCount   = useNotificationStore((s) => s.unreadCount)

  const budgets       = useBudgetStore((s) => s.budgets)
  const budgetLoading = useBudgetStore((s) => s.loading)
  const budgetOv      = useBudgetStore((s) => s.overview)

  const balance     = totalBalance()
  const ov          = savingsOv()
  const bov         = budgetOv()
  const firstName   = fullName()?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there"
  const activeGoals = goals.filter((g) => g.status === "active").slice(0, 3)
  const recentNotifs = useMemo(
    () => notifications.filter((n) => !n.read).slice(0, 4),
    [notifications]
  )

  const overCount   = budgets.filter((b) => Number(b.percent_used) >= 100).length
  const topBudgets  = [...budgets].sort((a, b) => Number(b.spent) - Number(a.spent)).slice(0, 4)

  return (
    <div className="page-reveal">

      {/* Header */}
      <div className="flex items-end justify-between mb-7">
        <div>
          <p className="mono text-[11px] text-stone-400 mb-1 tracking-wide">{getGreeting()}</p>
          <h1 className="text-[28px] font-semibold text-stone-900 tracking-tight leading-none">
            {firstName} 👋
          </h1>
          <p className="mono text-[11px] text-stone-400 mt-1.5">{CURRENT_MONTH} {CURRENT_YEAR}</p>
        </div>
        {unreadCount() > 0 && (
          <div className="flex items-center gap-1.5 bg-stone-900 text-white mono text-[10px] px-3 py-2 rounded-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {unreadCount()} new alert{unreadCount() > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Hero balance */}
      <div className="relative rounded-3xl overflow-hidden mb-5 border border-stone-200">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-50 via-white to-emerald-50/40" />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-emerald-100/30 -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-stone-200/20 translate-y-1/2 -translate-x-1/4 blur-2xl" />
        <div className="relative p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="mono text-[10px] tracking-[0.18em] uppercase text-stone-400 mb-2">Total balance</p>
              <p className="text-[40px] font-semibold text-stone-900 tracking-tight leading-none">
                ₱{balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </p>
              <p className="mono text-[11px] text-stone-400 mt-2">
                across {accounts.length} account{accounts.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 pt-1">
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5">
                <TrendingUp size={11} className="text-emerald-600" />
                <span className="mono text-[11px] text-emerald-700 font-medium">
                  +₱{summary.income.toLocaleString("en-PH", { minimumFractionDigits: 0 })}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5">
                <TrendingDown size={11} className="text-red-500" />
                <span className="mono text-[11px] text-red-600 font-medium">
                  -₱{summary.expenses.toLocaleString("en-PH", { minimumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-5 pt-5 border-t border-stone-200/60">
            <div className="flex items-center justify-between mb-2">
              <p className="mono text-[10px] text-stone-400">Monthly net</p>
              <div className="flex items-center gap-1">
                {summary.net >= 0
                  ? <ArrowUpRight size={11} className="text-emerald-600" />
                  : <ArrowDownRight size={11} className="text-red-500" />
                }
                <p className={cn("mono text-[12px] font-semibold", summary.net >= 0 ? "text-emerald-700" : "text-red-500")}>
                  {summary.net >= 0 ? "+" : ""}₱{summary.net.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            {summary.income > 0 && (
              <>
                <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min((summary.expenses / summary.income) * 100, 100)}%` }}
                  />
                </div>
                <p className="mono text-[9px] text-stone-400 mt-1.5 text-right">
                  {Math.round((summary.expenses / summary.income) * 100)}% of income spent
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mini summary */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <MiniCard label="Income"   value={summary.income}   color="emerald" icon={TrendingUp}  />
        <MiniCard label="Expenses" value={summary.expenses} color="red"     icon={TrendingDown} />
        <MiniCard
          label="Savings"
          value={ov.totalSaved}
          color="sky"
          icon={PiggyBank}
          sub={`${ov.activeGoals} goal${ov.activeGoals !== 1 ? "s" : ""} active`}
        />
      </div>

      <div className="grid grid-cols-3 gap-5">

        {/* Left + centre */}
        <div className="col-span-2 flex flex-col gap-5">

          {/* Budget */}
          <Section
            title="Budget"
            sub={
              budgetLoading
                ? "Loading..."
                : budgets.length === 0
                ? "No budgets set this month"
                : overCount > 0
                ? `${overCount} categor${overCount > 1 ? "ies" : "y"} over budget`
                : `₱${bov.totalRemaining.toLocaleString("en-PH", { minimumFractionDigits: 0 })} remaining`
            }
            subColor={overCount > 0 ? "text-red-500" : "text-emerald-600"}
            action={{ label: "Manage", onClick: () => navigate("/app/budget") }}
          >
            {budgetLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-2.5 w-32 bg-stone-100 rounded mb-2" />
                    <div className="h-1.5 bg-stone-100 rounded-full" />
                  </div>
                ))}
              </div>
            ) : budgets.length === 0 ? (
              <EmptyState
                icon={Target}
                label="No budgets yet"
                sub="Set spending limits per category"
                action={{ label: "Create budget", onClick: () => navigate("/app/budget") }}
              />
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  {budgets.slice(0, 5).map((b) => {
                    const pct    = Math.min(Number(b.percent_used), 100)
                    const status = getBudgetStatus(Number(b.percent_used))
                    const icon   = CATEGORY_ICONS[b.category] ?? "📦"
                    return (
                      <div key={b.id}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[13px]">{icon}</span>
                            <p className="text-[12px] text-stone-700">{b.category}</p>
                            {status === "over" && (
                              <span className="mono text-[9px] bg-red-50 text-red-500 border border-red-200 px-1.5 py-0.5 rounded-full">over</span>
                            )}
                          </div>
                          <p className={cn(
                            "mono text-[11px] font-medium",
                            status === "over"    ? "text-red-500"
                            : status === "warning" ? "text-amber-600"
                            : "text-stone-500"
                          )}>
                            ₱{Number(b.spent).toLocaleString()} / ₱{b.budget_amount.toLocaleString()}
                          </p>
                        </div>
                        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-500", STATUS_COLORS[status])}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-stone-50 flex items-center justify-between">
                  <p className="mono text-[10px] text-stone-400">
                    ₱{bov.totalSpent.toLocaleString()} of ₱{bov.totalBudgeted.toLocaleString()} total
                  </p>
                  <p className={cn("mono text-[10px] font-medium", overCount > 0 ? "text-red-500" : "text-emerald-600")}>
                    {bov.overallPercent}% used
                  </p>
                </div>
              </>
            )}
          </Section>

          {/* Accounts */}
          <Section
            title="Accounts"
            sub={`₱${balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })} total`}
            action={{ label: "View all", onClick: () => navigate("/app/accounts") }}
          >
            {accounts.length === 0 ? (
              <EmptyState
                icon={Wallet}
                label="No accounts"
                sub="Add an account to get started"
                action={{ label: "Add account", onClick: () => navigate("/app/accounts") }}
              />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {accounts.slice(0, 4).map((a) => {
                  const Icon     = ACCOUNT_ICONS[a.type] ?? Wallet
                  const sharePct = balance > 0 ? Math.round((a.balance / balance) * 100) : 0
                  return (
                    <div key={a.id} className="bg-stone-50 rounded-xl p-3.5 border border-stone-100">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: a.color + "22" }}>
                          <Icon size={13} style={{ color: a.color }} />
                        </div>
                        <p className="text-[12px] font-medium text-stone-700 truncate">{a.name}</p>
                      </div>
                      <p className="mono text-[14px] font-semibold text-stone-900">
                        ₱{a.balance.toLocaleString("en-PH", { minimumFractionDigits: 0 })}
                      </p>
                      <div className="mt-2 h-1 bg-stone-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-stone-400" style={{ width: `${sharePct}%` }} />
                      </div>
                      <p className="mono text-[9px] text-stone-400 mt-1">{sharePct}% of total</p>
                    </div>
                  )
                })}
              </div>
            )}
          </Section>

          {/* Savings */}
          <Section
            title="Savings goals"
            sub={goals.length > 0 ? `${ov.totalPercent}% overall · ₱${ov.totalSaved.toLocaleString()} saved` : undefined}
            action={{ label: "View all", onClick: () => navigate("/app/savings") }}
          >
            {activeGoals.length === 0 ? (
              <EmptyState
                icon={PiggyBank}
                label="No active goals"
                sub="Create your first savings goal"
                action={{ label: "New goal", onClick: () => navigate("/app/savings") }}
              />
            ) : (
              <div className="flex flex-col gap-4">
                {activeGoals.map((g) => {
                  const pct = Math.min(Math.round((g.current_amount / g.target_amount) * 100), 100)
                  return (
                    <div key={g.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[13px] font-medium text-stone-800">{g.title}</p>
                        <p className="mono text-[11px] text-stone-500">
                          ₱{g.current_amount.toLocaleString()} / ₱{g.target_amount.toLocaleString()}
                        </p>
                      </div>
                      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <p className="mono text-[9px] text-stone-400">{pct}% complete</p>
                        {g.target_date && (
                          <p className="mono text-[9px] text-stone-400">
                            Due {new Date(g.target_date).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
                {goals.length > 3 && (
                  <button onClick={() => navigate("/app/savings")} className="mono text-[10px] text-stone-400 hover:text-emerald-600 transition-colors text-center">
                    +{goals.length - 3} more goal{goals.length - 3 > 1 ? "s" : ""}
                  </button>
                )}
              </div>
            )}
          </Section>

          {/* Family */}
          {family && (
            <Section
              title="Family"
              sub={`${family.members.length} member${family.members.length !== 1 ? "s" : ""} · ${family.name}`}
              action={{ label: "View", onClick: () => navigate("/app/family") }}
            >
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {family.members.slice(0, 6).map((m) => (
                    <div key={m.id} title={m.profile?.full_name ?? ""} className="w-9 h-9 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center overflow-hidden">
                      {m.profile?.avatar_url
                        ? <img src={m.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        : <span className="mono text-[11px] text-emerald-700 font-medium">{(m.profile?.full_name ?? "?").slice(0, 1).toUpperCase()}</span>
                      }
                    </div>
                  ))}
                  {family.members.length > 6 && (
                    <div className="w-9 h-9 rounded-full bg-stone-100 border-2 border-white flex items-center justify-center">
                      <span className="mono text-[9px] text-stone-500">+{family.members.length - 6}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigate("/app/family/transactions")} className="flex items-center gap-1.5 h-8 px-3 mono text-[10px] bg-stone-50 border border-stone-200 hover:border-emerald-400 hover:text-emerald-600 rounded-xl transition-colors text-stone-500">
                    <ArrowLeftRight size={11} /> Shared txns
                  </button>
                  <button onClick={() => navigate("/app/family/members")} className="flex items-center gap-1.5 h-8 px-3 mono text-[10px] bg-stone-50 border border-stone-200 hover:border-stone-300 rounded-xl transition-colors text-stone-500">
                    <Users size={11} /> Members
                  </button>
                </div>
              </div>
            </Section>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">

          {/* AI Insights */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-stone-50">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center">
                <Sparkles size={13} className="text-violet-600" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-stone-900 leading-none">AI Insights</p>
                <p className="mono text-[9px] text-stone-400 mt-0.5">Powered by your spending data</p>
              </div>
              <span className="mono text-[9px] bg-violet-50 text-violet-600 border border-violet-200 px-1.5 py-0.5 rounded-full">Beta</span>
            </div>
            <div className="divide-y divide-stone-50">
              {AI_INSIGHTS.map((insight) => {
                const Icon = insight.icon
                return (
                  <div key={insight.id} className="px-5 py-4 hover:bg-stone-50/60 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={cn("w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5", insight.color)}>
                        <Icon size={12} />
                      </div>
                      <div>
                        <p className="text-[12px] font-medium text-stone-800 leading-snug">{insight.title}</p>
                        <p className="mono text-[10px] text-stone-400 mt-1 leading-relaxed">{insight.desc}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="px-5 py-3 border-t border-stone-50">
              <button onClick={() => navigate("/app/classify")} className="w-full mono text-[10px] text-stone-400 hover:text-violet-600 transition-colors flex items-center justify-center gap-1.5">
                <Sparkles size={10} /> Open AI Classify <ChevronRight size={10} />
              </button>
            </div>
          </div>

          {/* Top spending */}
          {topBudgets.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-5">
              <p className="text-[13px] font-semibold text-stone-900 mb-4">Top spending</p>
              <div className="flex flex-col gap-2.5">
                {topBudgets.map((b) => {
                  const sharePct = bov.totalSpent > 0 ? Math.round((Number(b.spent) / bov.totalSpent) * 100) : 0
                  const status   = getBudgetStatus(Number(b.percent_used))
                  const icon     = CATEGORY_ICONS[b.category] ?? "📦"
                  return (
                    <div key={b.id} className="flex items-center gap-2.5">
                      <span className="text-[13px] shrink-0">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="mono text-[10px] text-stone-600 truncate">{b.category}</p>
                          <p className="mono text-[10px] text-stone-400 shrink-0 ml-1">{sharePct}%</p>
                        </div>
                        <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", STATUS_COLORS[status])}
                            style={{ width: `${sharePct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Alerts */}
          {recentNotifs.length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-stone-50">
                <p className="text-[13px] font-semibold text-stone-900">Alerts</p>
                <span className="mono text-[9px] bg-red-50 text-red-500 border border-red-200 px-1.5 py-0.5 rounded-full">
                  {recentNotifs.length} unread
                </span>
              </div>
              <div className="divide-y divide-stone-50">
                {recentNotifs.map((n) => (
                  <div key={n.id} className="px-5 py-3.5 hover:bg-stone-50/50 transition-colors">
                    <p className="text-[12px] font-medium text-stone-800 leading-tight">{n.title}</p>
                    <p className="mono text-[10px] text-stone-400 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transactions shortcut */}
          <button
            onClick={() => navigate("/app/transactions")}
            className="w-full bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-5 flex items-center justify-between hover:border-emerald-300 hover:shadow-[0_4px_24px_rgba(16,185,129,0.08)] transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CircleDollarSign size={16} className="text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="text-[13px] font-medium text-stone-800">Transactions</p>
                <p className="mono text-[10px] text-stone-400">View all activity</p>
              </div>
            </div>
            <ChevronRight size={14} className="text-stone-300 group-hover:text-emerald-500 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  )
}

function MiniCard({ label, value, color, icon: Icon, sub }: {
  label: string; value: number; color: "emerald" | "red" | "sky"
  icon: typeof TrendingUp; sub?: string
}) {
  const colors = {
    emerald: { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-t-emerald-400" },
    red:     { text: "text-red-500",     bg: "bg-red-50",     border: "border-t-red-400"     },
    sky:     { text: "text-sky-600",     bg: "bg-sky-50",     border: "border-t-sky-400"     },
  }
  const c = colors[color]
  return (
    <div className={cn("bg-white rounded-2xl border-t-2 border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-4", c.border)}>
      <div className="flex items-center gap-2 mb-2.5">
        <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", c.bg)}>
          <Icon size={12} className={c.text} />
        </div>
        <p className="mono text-[10px] text-stone-400 uppercase tracking-[0.1em]">{label}</p>
      </div>
      <p className={cn("text-[17px] font-semibold tracking-tight", c.text)}>
        ₱{value.toLocaleString("en-PH", { minimumFractionDigits: 0 })}
      </p>
      <p className="mono text-[9px] text-stone-400 mt-0.5">{sub ?? "this month"}</p>
    </div>
  )
}

function Section({ title, sub, subColor, action, children }: {
  title: string; sub?: string; subColor?: string
  action?: { label: string; onClick: () => void }; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[14px] font-semibold text-stone-900">{title}</p>
          {sub && <p className={cn("mono text-[10px] mt-0.5", subColor ?? "text-stone-400")}>{sub}</p>}
        </div>
        {action && (
          <button onClick={action.onClick} className="mono text-[10px] text-stone-400 hover:text-emerald-600 flex items-center gap-0.5 transition-colors shrink-0">
            {action.label} <ChevronRight size={10} />
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function EmptyState({ icon: Icon, label, sub, action }: {
  icon: typeof Wallet; label: string; sub: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex flex-col items-center py-5 text-center">
      <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center mb-2.5">
        <Icon size={18} className="text-stone-300" />
      </div>
      <p className="text-[13px] font-medium text-stone-600">{label}</p>
      <p className="mono text-[10px] text-stone-400 mt-0.5">{sub}</p>
      {action && (
        <button onClick={action.onClick} className="mt-2.5 mono text-[10px] text-emerald-600 hover:text-emerald-700 transition-colors">
          {action.label} →
        </button>
      )}
    </div>
  )
}