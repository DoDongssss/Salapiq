import { z } from "zod"

export type GoalStatus   = "active" | "achieved" | "paused"
export type GoalPriority = "low" | "medium" | "high"

export type SavingsGoal = {
  id:             string
  user_id:        string
  family_id:      string | null
  title:          string
  category:       string
  target_amount:  number
  current_amount: number
  status:         GoalStatus
  priority:       GoalPriority
  target_date:    string | null
  achieved_at:    string | null
  created_at:     string
  updated_at:     string
}

export type GoalContribution = {
  id:         string
  goal_id:    string
  user_id:    string
  amount:     number
  note:       string | null
  created_at: string
}

export const goalSchema = z.object({
  title:         z.string().min(1, "required").min(2, "at least 2 characters"),
  category:      z.string().min(1, "required"),
  target_amount: z.number({ error: "must be a number" }).min(1, "must be greater than 0"),
  priority:      z.enum(["low", "medium", "high"]),
  target_date:   z.string().optional(),
  family_id:     z.string().optional(),
})

export type GoalForm = z.infer<typeof goalSchema>

export const contributionSchema = z.object({
  amount:            z.number({ error: "must be a number" }).min(0.01, "must be greater than 0"),
  note:              z.string().optional(),
  source_account_id: z.string().min(1, "select an account"),
})

export type ContributionForm = z.infer<typeof contributionSchema>


export function getGoalPercent(goal: SavingsGoal): number {
  if (goal.target_amount <= 0) return 0
  return Math.min(Math.round((goal.current_amount / goal.target_amount) * 100), 100)
}

export function getDaysLeft(targetDate: string | null): number | null {
  if (!targetDate) return null
  const diff = new Date(targetDate).getTime() - new Date().getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}