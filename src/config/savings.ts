import type { GoalStatus, GoalPriority } from "@/types"

export const GOAL_CATEGORIES = [
  { value: "emergency", label: "Emergency Fund", icon: "🛡️" },
  { value: "travel",    label: "Travel",         icon: "✈️" },
  { value: "gadget",    label: "Gadget",         icon: "💻" },
  { value: "home",      label: "Home",           icon: "🏠" },
  { value: "education", label: "Education",      icon: "📚" },
  { value: "vehicle",   label: "Vehicle",        icon: "🚗" },
  { value: "other",     label: "Other",          icon: "🎯" },
] as const

export const GOAL_PRIORITIES: { value: GoalPriority; label: string }[] = [
  { value: "low",    label: "Low"    },
  { value: "medium", label: "Medium" },
  { value: "high",   label: "High"   },
]

export const GOAL_STATUSES: { value: GoalStatus; label: string }[] = [
  { value: "active",   label: "Active"   },
  { value: "achieved", label: "Achieved" },
  { value: "paused",   label: "Paused"   },
]

export const GOAL_STATUS_COLORS: Record<GoalStatus, string> = {
  active:   "text-emerald-700 bg-emerald-50 border-emerald-200",
  achieved: "text-sky-700 bg-sky-50 border-sky-200",
  paused:   "text-stone-600 bg-stone-100 border-stone-200",
}

export const GOAL_PRIORITY_COLORS: Record<GoalPriority, string> = {
  low:    "text-stone-500 bg-stone-100 border-stone-200",
  medium: "text-amber-700 bg-amber-50 border-amber-200",
  high:   "text-red-600 bg-red-50 border-red-200",
}

export const GOAL_STATUS_FILTER = [
  { value: "all",      label: "All"      },
  { value: "active",   label: "Active"   },
  { value: "achieved", label: "Achieved" },
  { value: "paused",   label: "Paused"   },
] as const

export type GoalStatusFilter = typeof GOAL_STATUS_FILTER[number]["value"]
