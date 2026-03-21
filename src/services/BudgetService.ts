import { supabase } from "@/lib/supabaseClient"
import type { Budget, BudgetSummary, BudgetForm } from "@/types/BudgetTypes"


export async function getBudgetSummary(
  userId: string,
  month:  number,
  year:   number
): Promise<BudgetSummary[]> {
  const { data, error } = await supabase
    .from("budget_summary")
    .select("*")
    .eq("user_id", userId)
    .eq("month", month)
    .eq("year",  year)
    .order("category", { ascending: true })

  if (error) return []
  return data as BudgetSummary[]
}

export async function getBudget(id: string): Promise<Budget | null> {
  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) return null
  return data as Budget
}

export async function createBudget(
  userId:  string,
  payload: BudgetForm
): Promise<{ data: Budget | null; error: string | null }> {
  const { data, error } = await supabase
    .from("budgets")
    .insert({
      user_id:  userId,
      category: payload.category,
      amount:   payload.amount,
      month:    payload.month,
      year:     payload.year,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Budget, error: null }
}

export async function updateBudget(
  id:      string,
  payload: Partial<BudgetForm>
): Promise<string | null> {
  const { error } = await supabase
    .from("budgets")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)

  return error ? error.message : null
}

export async function deleteBudget(id: string): Promise<string | null> {
  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", id)

  return error ? error.message : null
}


export function getBudgetOverview(budgets: BudgetSummary[]): {
  totalBudgeted: number
  totalSpent:    number
  totalRemaining: number
  overallPercent: number
} {
  const totalBudgeted  = budgets.reduce((s, b) => s + b.budget_amount, 0)
  const totalSpent     = budgets.reduce((s, b) => s + b.spent, 0)
  const totalRemaining = totalBudgeted - totalSpent
  const overallPercent = totalBudgeted > 0
    ? Math.round((totalSpent / totalBudgeted) * 100)
    : 0

  return { totalBudgeted, totalSpent, totalRemaining, overallPercent }
}