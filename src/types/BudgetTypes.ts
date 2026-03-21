import { z } from "zod"

export type Budget = {
  id:         string
  user_id:    string
  family_id:  string | null
  category:   string
  amount:     number
  month:      number
  year:       number
  created_at: string
  updated_at: string
}

export type BudgetSummary = Budget & {
  budget_amount: number
  spent:         number
  remaining:     number
  percent_used:  number
}

export const budgetSchema = z.object({
  category: z.string().min(1, "required"),
  amount:   z.number({ error: "must be a number" }).min(1, "must be greater than 0"),
  month:    z.number().min(1).max(12),
  year:     z.number().min(2020),
})

export type BudgetForm = z.infer<typeof budgetSchema>


export type BudgetStatus = "safe" | "warning" | "over"

export function getBudgetStatus(percentUsed: number): BudgetStatus {
  if (percentUsed >= 100) return "over"
  if (percentUsed >= 80)  return "warning"
  return "safe"
}