import { z } from "zod"

export type RecurringTransaction = {
  id:           string
  user_id:      string
  account_id:   string
  type:         "income" | "expense"
  amount:       number
  category:     string | null
  note:         string | null
  day_of_month: number
  is_active:    boolean
  last_run_at:  string | null
  created_at:   string
  updated_at:   string
  account?:     { name: string; color: string; icon: string; type: string } | null
}

export const recurringSchema = z.object({
  account_id:   z.string().min(1, "required"),
  type:         z.enum(["income", "expense"]),
  amount:       z.number().min(0.01, "required"),
  day_of_month: z.number().min(1).max(28),
  category:     z.string().optional(),
  note:         z.string().optional(),
  is_active:    z.boolean(),             
})

export type RecurringForm = {
  account_id:   string
  type:         "income" | "expense"
  amount:       number
  day_of_month: number
  category?:    string
  note?:        string
  is_active:    boolean
}

export const DAY_OPTIONS = Array.from({ length: 28 }, (_, i) => ({
  value: i + 1,
  label: `Day ${i + 1}${
    i + 1 === 1 ? "st" :
    i + 1 === 2 ? "nd" :
    i + 1 === 3 ? "rd" : "th"
  }`,
}))