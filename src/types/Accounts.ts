import { z } from "zod"

export type Account = {
  id:         string
  user_id:    string
  family_id:  string | null
  name:       string
  type:       "bank" | "debit" | "ewallet" | "cash"
  provider:   string | null
  balance:    number
  currency:   string
  color:      string
  icon:       string
  is_active:  boolean
  created_at: string
  updated_at: string
}

export type Transaction = {
  id:             string
  user_id:        string
  account_id:     string
  family_id:      string | null
  amount:         number
  type:           "income" | "expense" | "transfer"
  category:       string | null
  note:           string | null
  date:           string
  to_account_id:  string | null
  ai_category:    string | null
  ai_confidence:  number | null
  ai_classified:  boolean
  receipt_url:    string | null
  created_at:     string
  updated_at:     string
}

export const accountSchema = z.object({
  name:      z.string().min(1, "required"),
  type:      z.enum(["bank", "debit", "ewallet", "cash"]),
  provider:  z.string().optional(),
  balance:   z.number({ error: "must be a number" }).default(0),
  currency:  z.string().min(1, "required"),
  color:     z.string().min(1, "required"),
  icon:      z.string().min(1, "required"),
})

export type AccountForm = z.infer<typeof accountSchema>

export const transactionSchema = z.object({
  account_id:    z.string().min(1, "select an account"),
  amount:        z.number({ error: "must be a number" }).min(0.01, "must be greater than 0"),
  type:          z.enum(["income", "expense", "transfer"]),
  category:      z.string().optional(),
  note:          z.string().optional(),
  date:          z.string().min(1, "required"),
  to_account_id: z.string().optional(),
})

export type TransactionForm = z.infer<typeof transactionSchema>

export const ACCOUNT_TYPES = [
  { value: "bank",    label: "Bank account"   },
  { value: "debit",   label: "Debit card"     },
  { value: "ewallet", label: "E-wallet"       },
  { value: "cash",    label: "Cash wallet"    },
] as const

export const ACCOUNT_PROVIDERS = {
  bank:    ["BDO", "BPI", "Metrobank", "UnionBank", "PNB", "Landbank", "Security Bank", "RCBC"],
  debit:   ["BDO", "BPI", "Metrobank", "UnionBank", "PNB"],
  ewallet: ["GCash", "Maya", "ShopeePay", "GrabPay", "Coins.ph"],
  cash:    [],
}

export const ACCOUNT_COLORS = [
  "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b",
  "#ef4444", "#06b6d4", "#ec4899", "#64748b",
]

export const TRANSACTION_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Utilities",
  "Healthcare",
  "Entertainment",
  "Education",
  "Savings",
  "Other",
]