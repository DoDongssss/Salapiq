import {
  User, Shield, Bell, Sparkles, Trash2, TrendingUp, TrendingDown, ArrowLeftRight,
  Wallet, Building2, CreditCard, Smartphone,
  type LucideIcon,
} from "lucide-react"

export const SETTINGS_TABS = [
  { id: "profile",     icon: User,     label: "Profile"      },
  { id: "security",    icon: Shield,   label: "Security"     },
  { id: "preferences", icon: Bell,     label: "Preferences"  },
  { id: "ai",          icon: Sparkles, label: "AI & Privacy" },
  { id: "danger",      icon: Trash2,   label: "Danger zone"  },
] as const

export type SettingsTabId = (typeof SETTINGS_TABS)[number]["id"]

export const CURRENCIES = [
  { value: "PHP", label: "PHP — Philippine Peso"    },
  { value: "USD", label: "USD — US Dollar"          },
  { value: "EUR", label: "EUR — Euro"               },
  { value: "JPY", label: "JPY — Japanese Yen"       },
  { value: "SGD", label: "SGD — Singapore Dollar"   },
  { value: "AUD", label: "AUD — Australian Dollar"  },
]

export const TIMEZONES = [
  { value: "Asia/Manila",       label: "Asia/Manila (PHT +8)"         },
  { value: "UTC",               label: "UTC (Universal Time)"         },
  { value: "America/New_York",  label: "America/New_York (EST -5)"    },
  { value: "Europe/London",     label: "Europe/London (GMT +0)"       },
  { value: "Asia/Singapore",    label: "Asia/Singapore (SGT +8)"      },
  { value: "Asia/Tokyo",        label: "Asia/Tokyo (JST +9)"          },
]

export const THEMES = [
  { value: "light",  label: "Light"  },
  { value: "dark",   label: "Dark"   },
  { value: "system", label: "System" },
]

export const LANGUAGES = [
  { value: "en",  label: "English"  },
  { value: "fil", label: "Filipino" },
]

export const DATE_FORMATS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY — US style"      },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY — EU style"      },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD — ISO 8601"      },
]

import type { NotificationPrefs } from "@/types/SettingsTypes"

export const NOTIFICATION_ROWS: {
  key: keyof NotificationPrefs
  label: string
  desc: string
}[] = [
  {
    key:   "weeklyReport",
    label: "Weekly spending report",
    desc:  "Summary of your expenses every Monday",
  },
  {
    key:   "budgetAlerts",
    label: "Budget limit alerts",
    desc:  "Alert when a category reaches 80% of budget",
  },
  {
    key:   "goalReminders",
    label: "Savings goal reminders",
    desc:  "Monthly reminders to top up your goals",
  },
  {
    key:   "loginAlerts",
    label: "New login alerts",
    desc:  "Notify when account is accessed from a new device",
  },
]

export const PRIVACY_ROWS = [
  {
    icon:  "🔒",
    title: "Local AI model",
    desc:  "The AI model runs in your browser via WebAssembly. No expense data is sent to external servers.",
  },
  {
    icon:  "💾",
    title: "Browser storage",
    desc:  "Your AI corrections are saved in localStorage on your device only. Never synced to our servers.",
  },
  {
    icon:  "🗄️",
    title: "Supabase storage",
    desc:  "Your profile, transactions and budgets are stored encrypted in Supabase. We never sell your data.",
  },
  {
    icon:  "🛡️",
    title: "Row Level Security",
    desc:  "Your data is protected by Supabase RLS — only you can access your own records.",
  },
]

export const TRANSACTION_TYPE_ICONS: Record<string, LucideIcon> = {
  income:   TrendingUp,
  expense:  TrendingDown,
  transfer: ArrowLeftRight,
}

export const TRANSACTION_TYPE_COLORS: Record<string, string> = {
  income:   "text-emerald-600 bg-emerald-50",
  expense:  "text-red-500 bg-red-50",
  transfer: "text-sky-600 bg-sky-50",
}

export const TRANSACTION_AMOUNT_COLORS: Record<string, string> = {
  income:   "text-emerald-600",
  expense:  "text-stone-800",
  transfer: "text-sky-600",
}

export const TRANSACTION_AMOUNT_PREFIX: Record<string, string> = {
  income:   "+",
  expense:  "−",
  transfer: "",
}

export const ACCOUNT_TYPE_ICONS: Record<string, LucideIcon> = {
  bank:    Building2,
  debit:   CreditCard,
  ewallet: Smartphone,
  cash:    Wallet,
}

export const TRANSACTION_FILTERS = [
  { value: "all",      label: "All"       },
  { value: "expense",  label: "Expenses"  },
  { value: "income",   label: "Income"    },
  { value: "transfer", label: "Transfers" },
] as const