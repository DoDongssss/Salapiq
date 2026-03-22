import { useMemo } from "react"
import { useBudgetStore }      from "@/stores/useBudgetStore"
import { useSavingsStore }     from "@/stores/useSavingsStore"
import { useTransactionStore } from "@/stores/useTransactionStore"
import { useAccountStore }     from "@/stores/useAccountStore"
import { getBudgetStatus }     from "@/types"
import {
  AlertTriangle, Lightbulb, Target,
  TrendingDown, TrendingUp, PiggyBank,
  Wallet, AlertCircle,
  type LucideIcon,
} from "lucide-react"

export type Insight = {
  id:    string
  icon:  LucideIcon
  color: string
  title: string
  desc:  string
}

export function useInsights(): Insight[] {
  const budgets  = useBudgetStore((s) => s.budgets)
  const budgetOv = useBudgetStore((s) => s.overview)
  const goals    = useSavingsStore((s) => s.goals)
  const summary  = useTransactionStore((s) => s.summary)
  const accounts = useAccountStore((s) => s.accounts)

  const bov = budgetOv()

  return useMemo(() => {
    const insights: Insight[] = []

    // Over budget categories
    const overBudget = budgets.filter((b) => Number(b.percent_used) >= 100)
    if (overBudget.length > 0) {
      const names = overBudget.slice(0, 2).map((b) => b.category).join(", ")
      insights.push({
        id:    "over-budget",
        icon:  AlertTriangle,
        color: "text-red-600 bg-red-50 border-red-200",
        title: `Over budget: ${names}${overBudget.length > 2 ? ` +${overBudget.length - 2} more` : ""}`,
        desc:  `You've exceeded your limit in ${overBudget.length} categor${overBudget.length > 1 ? "ies" : "y"} this month. Consider adjusting your spending.`,
      })
    }

    // Near limit (warning) categories
    const nearLimit = budgets.filter((b) => {
      const status = getBudgetStatus(Number(b.percent_used))
      return status === "warning"
    })
    if (nearLimit.length > 0 && overBudget.length === 0) {
      const b    = nearLimit[0]
      const left = Math.max(b.budget_amount - Number(b.spent), 0)
      insights.push({
        id:    "near-limit",
        icon:  AlertCircle,
        color: "text-amber-600 bg-amber-50 border-amber-200",
        title: `${b.category} near limit`,
        desc:  `₱${left.toLocaleString("en-PH", { minimumFractionDigits: 0 })} left of your ₱${b.budget_amount.toLocaleString()} budget. Slow down spending here.`,
      })
    }

    // Good budget health
    const safeBudgets = budgets.filter((b) => getBudgetStatus(Number(b.percent_used)) === "safe")
    if (budgets.length > 0 && safeBudgets.length === budgets.length) {
      insights.push({
        id:    "budget-good",
        icon:  Lightbulb,
        color: "text-emerald-600 bg-emerald-50 border-emerald-200",
        title: "All budgets on track",
        desc:  `You've used ${bov.overallPercent}% of your total budget. ₱${bov.totalRemaining.toLocaleString("en-PH", { minimumFractionDigits: 0 })} remaining this month.`,
      })
    }

    // Top spending category
    const topBudget = [...budgets].sort((a, b) => Number(b.spent) - Number(a.spent))[0]
    if (topBudget && Number(topBudget.spent) > 0) {
      const sharePct = bov.totalSpent > 0
        ? Math.round((Number(topBudget.spent) / bov.totalSpent) * 100)
        : 0
      insights.push({
        id:    "top-spending",
        icon:  TrendingDown,
        color: "text-sky-600 bg-sky-50 border-sky-200",
        title: `${topBudget.category} is your top expense`,
        desc:  `₱${Number(topBudget.spent).toLocaleString("en-PH", { minimumFractionDigits: 0 })} spent — ${sharePct}% of your total expenses this month.`,
      })
    }

    // Goal close to being achieved
    const closeGoals = goals.filter((g) => {
      const pct = g.target_amount > 0
        ? (g.current_amount / g.target_amount) * 100
        : 0
      return g.status === "active" && pct >= 80 && pct < 100
    })
    if (closeGoals.length > 0) {
      const g    = closeGoals[0]
      const left = Math.max(g.target_amount - g.current_amount, 0)
      insights.push({
        id:    "goal-close",
        icon:  Target,
        color: "text-emerald-600 bg-emerald-50 border-emerald-200",
        title: `${g.title} almost done`,
        desc:  `Only ₱${left.toLocaleString("en-PH", { minimumFractionDigits: 0 })} left to reach your goal. Keep going!`,
      })
    }

    // Overdue goals
    const overdueGoals = goals.filter((g) => {
      if (!g.target_date || g.status !== "active") return false
      return new Date(g.target_date) < new Date()
    })
    if (overdueGoals.length > 0) {
      insights.push({
        id:    "goal-overdue",
        icon:  AlertTriangle,
        color: "text-red-600 bg-red-50 border-red-200",
        title: `${overdueGoals.length} goal${overdueGoals.length > 1 ? "s" : ""} past deadline`,
        desc:  `${overdueGoals.map((g) => g.title).join(", ")} ${overdueGoals.length > 1 ? "are" : "is"} past the target date. Consider updating the deadline or adding funds.`,
      })
    }

    // No active goals
    const activeGoals = goals.filter((g) => g.status === "active")
    if (activeGoals.length === 0 && goals.length === 0) {
      insights.push({
        id:    "no-goals",
        icon:  PiggyBank,
        color: "text-sky-600 bg-sky-50 border-sky-200",
        title: "Start saving today",
        desc:  "You have no savings goals yet. Create one to track your progress towards something meaningful.",
      })
    }

    // Spending more than earning
    if (summary.income > 0 && summary.expenses > summary.income) {
      const over = summary.expenses - summary.income
      insights.push({
        id:    "spending-over-income",
        icon:  AlertTriangle,
        color: "text-red-600 bg-red-50 border-red-200",
        title: "Expenses exceed income",
        desc:  `You've spent ₱${over.toLocaleString("en-PH", { minimumFractionDigits: 0 })} more than your income this month. Review your spending.`,
      })
    }

    // Good savings rate
    if (summary.income > 0 && summary.net > 0) {
      const savingsRate = Math.round((summary.net / summary.income) * 100)
      if (savingsRate >= 20) {
        insights.push({
          id:    "savings-rate",
          icon:  TrendingUp,
          color: "text-emerald-600 bg-emerald-50 border-emerald-200",
          title: `${savingsRate}% savings rate`,
          desc:  `You're keeping ₱${summary.net.toLocaleString("en-PH", { minimumFractionDigits: 0 })} of your income — that's a healthy savings rate. Great work!`,
        })
      }
    }

    // Low balance account warning
    const lowAccounts = accounts.filter((a) => a.balance < 1000 && a.balance >= 0)
    if (lowAccounts.length > 0) {
      const a = lowAccounts[0]
      insights.push({
        id:    "low-balance",
        icon:  Wallet,
        color: "text-amber-600 bg-amber-50 border-amber-200",
        title: `${a.name} is running low`,
        desc:  `Balance is ₱${a.balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}. Consider topping up to avoid declined transactions.`,
      })
    }

    // No insights fallback
    if (insights.length === 0) {
      insights.push({
        id:    "all-good",
        icon:  Lightbulb,
        color: "text-emerald-600 bg-emerald-50 border-emerald-200",
        title: "Everything looks good",
        desc:  "Add more transactions and budgets to get personalized spending insights here.",
      })
    }

    // Return top 3 most relevant
    return insights.slice(0, 3)
  }, [budgets, goals, summary, accounts, bov])
}