import {
  TrendingUp, TrendingDown, Wallet, Target,
  Coffee, ShoppingBag, Zap, Car, HeartPulse,
  PiggyBank, Sparkles, ChevronRight, Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"

const stats = [
  {
    label: "Total balance",
    value: "₱24,850",
    sub: "Available funds",
    trend: "+12%",
    up: true,
    accent: "border-t-emerald-400",
    icon: Wallet,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
  {
    label: "Total spent",
    value: "₱18,340",
    sub: "This month",
    trend: "+8%",
    up: false,
    accent: "border-t-red-400",
    icon: TrendingDown,
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
  },
  {
    label: "Budget left",
    value: "₱6,510",
    sub: "of ₱25,000",
    trend: "26% left",
    up: true,
    accent: "border-t-amber-400",
    icon: Target,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  {
    label: "Saved",
    value: "₱3,200",
    sub: "This month",
    trend: "On track ✓",
    up: true,
    accent: "border-t-sky-400",
    icon: TrendingUp,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-600",
  },
]

const transactions = [
  { icon: Coffee,      label: "Starbucks coffee",  category: "Food & Dining",  amount: "−₱240",   time: "Today, 8:12am", pos: false, bg: "bg-amber-50",   color: "text-amber-600"   },
  { icon: Car,         label: "Grab to Makati",    category: "Transportation", amount: "−₱185",   time: "Today, 7:45am", pos: false, bg: "bg-sky-50",     color: "text-sky-600"     },
  { icon: PiggyBank,   label: "Paluwagan payout",  category: "Savings",        amount: "+₱5,000", time: "Yesterday",     pos: true,  bg: "bg-emerald-50", color: "text-emerald-600" },
  { icon: ShoppingBag, label: "Shopee haul",       category: "Shopping",       amount: "−₱1,240", time: "Mar 17",        pos: false, bg: "bg-pink-50",    color: "text-pink-600"    },
  { icon: Zap,         label: "Meralco bill",      category: "Utilities",      amount: "−₱2,890", time: "Mar 15",        pos: false, bg: "bg-violet-50",  color: "text-violet-600"  },
  { icon: HeartPulse,  label: "Mercury Drug",      category: "Healthcare",     amount: "−₱680",   time: "Mar 14",        pos: false, bg: "bg-red-50",     color: "text-red-500"     },
]

const budgets = [
  { label: "Food & Dining",  spent: 6200, total: 8000, color: "bg-emerald-500" },
  { label: "Transportation", spent: 3100, total: 4000, color: "bg-sky-500"     },
  { label: "Shopping",       spent: 4800, total: 5000, color: "bg-amber-500"   },
  { label: "Utilities",      spent: 4240, total: 6000, color: "bg-violet-500"  },
  { label: "Healthcare",     spent: 680,  total: 2000, color: "bg-red-400"     },
  { label: "Entertainment",  spent: 320,  total: 1500, color: "bg-pink-500"    },
]

const goals = [
  { emoji: "✈️", label: "Japan trip",     current: 31000, target: 50000,  color: "bg-emerald-500" },
  { emoji: "💻", label: "New laptop",     current: 16000, target: 40000,  color: "bg-sky-500"     },
  { emoji: "🏠", label: "Emergency fund", current: 85000, target: 100000, color: "bg-amber-500"   },
]

const insights = [
  { label: "Food & Dining",  pct: 33, amount: "₱6,200", color: "bg-emerald-500" },
  { label: "Transportation", pct: 17, amount: "₱3,100", color: "bg-sky-500"     },
  { label: "Shopping",       pct: 26, amount: "₱4,800", color: "bg-amber-500"   },
  { label: "Utilities",      pct: 23, amount: "₱4,240", color: "bg-violet-500"  },
]

export default function Dashboard() {
  return (
    <div className="page-reveal">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 tracking-tight leading-tight">
            Good morning 👋
          </h1>
          <p className="mono text-[11px] text-stone-400 mt-1">March 2026 · PHP</p>
        </div>
        <div className="mono text-[10px] text-stone-300 flex items-center gap-1.5">
          <Sparkles size={10} className="text-emerald-400" />
          AI insights · runs locally
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5">
        {stats.map(({ label, value, sub, trend, up, accent, icon: Icon, iconBg, iconColor }) => (
          <div
            key={label}
            className={cn(
              "card-reveal bg-white rounded-2xl border border-stone-200 border-t-2 p-5",
              "shadow-[0_2px_16px_rgba(0,0,0,0.04)]",
              accent
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <p className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">{label}</p>
              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
                <Icon size={15} className={iconColor} />
              </div>
            </div>
            <p className="text-[26px] font-semibold text-stone-900 tracking-tight leading-none mb-2">
              {value}
            </p>
            <div className="flex items-center justify-between">
              <p className="mono text-[10px] text-stone-400">{sub}</p>
              <span className={cn(
                "mono text-[9px] font-medium px-2 py-0.5 rounded-full",
                up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
              )}>
                {trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_360px] gap-5 mb-5">

        <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-50">
            <h2 className="text-[13px] font-semibold text-stone-900">Recent transactions</h2>
            <button className="mono text-[10px] text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 transition-colors">
              View all <ChevronRight size={10} />
            </button>
          </div>
          <div className="divide-y divide-stone-50">
            {transactions.map(({ icon: Icon, label, category, amount, time, pos, bg, color }) => (
              <div key={label} className="flex items-center gap-3 px-5 py-3.5 hover:bg-stone-50/50 transition-colors">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", bg)}>
                  <Icon size={15} className={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-stone-800 font-medium leading-tight truncate">{label}</p>
                  <p className="mono text-[10px] text-stone-400 mt-0.5">{category}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn("mono text-[13px] font-medium", pos ? "text-emerald-600" : "text-stone-800")}>
                    {amount}
                  </p>
                  <p className="mono text-[9px] text-stone-300 mt-0.5">{time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-50">
            <h2 className="text-[13px] font-semibold text-stone-900">Budget progress</h2>
            <button className="mono text-[10px] text-emerald-600 hover:text-emerald-700 transition-colors">Edit</button>
          </div>
          <div className="px-5 py-4 flex flex-col gap-4">
            {budgets.map(({ label, spent, total, color }) => {
              const pct = Math.round((spent / total) * 100)
              const over = pct >= 90
              return (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] text-stone-700">{label}</span>
                    <span className="mono text-[10px] text-stone-400">
                      ₱{spent.toLocaleString()} / ₱{total.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full bar-fill", over ? "bg-red-400" : color)}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  {over && (
                    <p className="mono text-[9px] text-red-400 mt-1">Near limit — {pct}% used</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[360px_1fr] gap-5">

        <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-50">
            <h2 className="text-[13px] font-semibold text-stone-900">Savings goals</h2>
            <button className="mono text-[10px] text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 transition-colors">
              <Plus size={10} /> Add goal
            </button>
          </div>
          <div className="divide-y divide-stone-50">
            {goals.map(({ emoji, label, current, target, color }) => {
              const pct = Math.round((current / target) * 100)
              return (
                <div key={label} className="flex items-center gap-3 px-5 py-4">
                  <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-lg shrink-0">
                    {emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-[12px] font-medium text-stone-800">{label}</p>
                      <p className="mono text-[10px] text-emerald-600 font-medium">{pct}%</p>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden mb-1">
                      <div
                        className={cn("h-full rounded-full bar-fill", color)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mono text-[9px] text-stone-400">
                      ₱{current.toLocaleString()} of ₱{target.toLocaleString()}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-50">
            <div className="flex items-center gap-2">
              <h2 className="text-[13px] font-semibold text-stone-900">AI spending insights</h2>
              <span className="mono text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200">
                March 2026
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles size={10} className="text-emerald-400" />
              <span className="mono text-[10px] text-stone-400">100% private</span>
            </div>
          </div>

          <div className="p-5">
            <div className="flex h-2.5 rounded-full overflow-hidden mb-5 gap-px">
              {insights.map(({ label, pct, color }) => (
                <div
                  key={label}
                  className={cn("h-full bar-fill", color)}
                  style={{ width: `${pct}%` }}
                  title={`${label}: ${pct}%`}
                />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {insights.map(({ label, pct, amount, color }) => (
                <div key={label} className="rounded-xl bg-stone-50 border border-stone-100 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn("w-2 h-2 rounded-full shrink-0", color)} />
                    <span className="text-[11px] text-stone-500 truncate">{label}</span>
                  </div>
                  <p className="text-[24px] font-semibold text-stone-900 leading-none tracking-tight mb-1">
                    {pct}%
                  </p>
                  <p className="mono text-[10px] text-stone-400">{amount} spent</p>
                  <div className="mt-2.5 h-1 bg-stone-200 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", color)} style={{ width: `${pct * 3}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-start gap-2.5">
              <Sparkles size={13} className="text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-[12px] text-emerald-700 leading-relaxed font-light">
                Your shopping spend is at{" "}
                <span className="font-medium">96% of budget</span>{" "}
                with 12 days left this month. Consider holding off non-essential purchases.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}