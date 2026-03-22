export const PAGE_SIZE = 5

export const DATE_PRESETS = [
  { value: "today",  label: "Today"        },
  { value: "week",   label: "This week"    },
  { value: "month",  label: "This month"   },
  { value: "custom", label: "Custom range" },
  { value: "all",    label: "All time"     },
] as const

export type DatePreset = typeof DATE_PRESETS[number]["value"]

export const TYPE_OPTIONS = [
  { value: "all",      label: "All types" },
  { value: "expense",  label: "Expenses"  },
  { value: "income",   label: "Income"    },
  { value: "transfer", label: "Transfers" },
] as const

export type TypeFilter = typeof TYPE_OPTIONS[number]["value"]
