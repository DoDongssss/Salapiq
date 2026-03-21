import { supabase } from "@/lib/supabaseClient"
import type {
  SavingsGoal, GoalForm, GoalContribution,
  ContributionForm, GoalStatus,
} from "@/types/SavingsTypes"

export async function getGoals(
  userId:   string,
  familyId?: string,
  status?:  GoalStatus
): Promise<SavingsGoal[]> {
  let personalQuery = supabase
    .from("financial_goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (status) personalQuery = personalQuery.eq("status", status)

  const { data: personalGoals, error: personalError } = await personalQuery
  if (personalError) return []

  if (familyId) {
    let familyQuery = supabase
      .from("financial_goals")
      .select("*")
      .eq("family_id", familyId)
      .order("created_at", { ascending: false })

    if (status) familyQuery = familyQuery.eq("status", status)

    const { data: familyGoals, error: familyError } = await familyQuery

    if (familyError) return personalGoals as SavingsGoal[]

    const allGoals = [...(personalGoals ?? []), ...(familyGoals ?? [])]
    const seen     = new Set<string>()
    const merged   = allGoals.filter((g) => {
      if (seen.has(g.id)) return false
      seen.add(g.id)
      return true
    })

    return merged as SavingsGoal[]
  }

  return (personalGoals ?? []) as SavingsGoal[]
}

export async function createGoal(
  userId:  string,
  payload: GoalForm
): Promise<{ data: SavingsGoal | null; error: string | null }> {
  const { data, error } = await supabase
    .from("financial_goals")
    .insert({
      user_id:        userId,
      family_id:      payload.family_id || null,
      title:          payload.title,
      category:       payload.category,
      target_amount:  payload.target_amount,
      current_amount: 0,
      status:         "active",
      priority:       payload.priority,
      target_date:    payload.target_date || null,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as SavingsGoal, error: null }
}

export async function updateGoal(
  id:      string,
  payload: Partial<GoalForm & { status: GoalStatus; current_amount: number; achieved_at: string | null }>
): Promise<string | null> {
  const { error } = await supabase
    .from("financial_goals")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)

  return error ? error.message : null
}

export async function deleteGoal(id: string): Promise<string | null> {
  const { error } = await supabase
    .from("financial_goals")
    .delete()
    .eq("id", id)

  return error ? error.message : null
}


export async function addContribution(
  goalId:  string,
  userId:  string,
  payload: ContributionForm
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("goal_contributions")
    .insert({
      goal_id:           goalId,
      user_id:           userId,
      amount:            payload.amount,
      note:              payload.note || null,
      source_account_id: payload.source_account_id,
    })

  if (error) return { error: error.message }

  return { error: null }
}

export async function getContributions(goalId: string): Promise<GoalContribution[]> {
  const { data, error } = await supabase
    .from("goal_contributions")
    .select("*")
    .eq("goal_id", goalId)
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) return []
  return data as GoalContribution[]
}

export function getSavingsOverview(goals: SavingsGoal[]) {
  const active   = goals.filter((g) => g.status === "active")
  const achieved = goals.filter((g) => g.status === "achieved")

  const totalTarget  = active.reduce((s, g) => s + g.target_amount,  0)
  const totalSaved   = active.reduce((s, g) => s + g.current_amount, 0)
  const totalPercent = totalTarget > 0
    ? Math.round((totalSaved / totalTarget) * 100)
    : 0

  return {
    totalGoals:    goals.length,
    activeGoals:   active.length,
    achievedGoals: achieved.length,
    totalTarget,
    totalSaved,
    totalPercent,
  }
}