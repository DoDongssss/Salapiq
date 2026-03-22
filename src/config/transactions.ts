import {
  TrendingUp, TrendingDown, ArrowLeftRight,
  Wallet, Building2, CreditCard, Smartphone,
  type LucideIcon,
} from "lucide-react"

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
