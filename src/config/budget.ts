import type { BudgetStatus } from "@/types"

export const MONTH_LABELS = [
  "January", "February", "March",     "April",   "May",      "June",
  "July",    "August",   "September", "October", "November", "December",
]

export const STATUS_COLORS: Record<BudgetStatus, string> = {
  safe:    "bg-emerald-500",
  warning: "bg-amber-400",
  over:    "bg-red-500",
}

export const STATUS_TEXT: Record<BudgetStatus, string> = {
  safe:    "text-emerald-700 bg-emerald-50 border-emerald-200",
  warning: "text-amber-700 bg-amber-50 border-amber-200",
  over:    "text-red-600 bg-red-50 border-red-200",
}

export const STATUS_LABELS: Record<BudgetStatus, string> = {
  safe:    "On track",
  warning: "Near limit",
  over:    "Over budget",
}
