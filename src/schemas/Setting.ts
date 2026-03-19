import { z } from "zod"

// ─── Profile row (mirrors public.profiles) ────────────────────

export type Profile = {
  id:             string
  full_name:      string
  username:       string | null
  email:          string | null
  phone:          string | null
  avatar_url:     string | null
  role:           string
  currency:       string
  timezone:       string
  monthly_income: number | null
  ai_opt_in:      boolean
  is_active:      boolean
  is_verified:    boolean
  last_login_at:  string | null
  created_at:     string
  updated_at:     string
}

// ─── User settings row (mirrors public.user_settings) ─────────

export type UserSettingsRow = {
  id:                   string
  notif_weekly_report:  boolean
  notif_budget_alerts:  boolean
  notif_goal_reminders: boolean
  notif_login_alerts:   boolean
  ai_opt_in:            boolean
  ai_model:             string
  theme:                string
  language:             string
  date_format:          string
}

// ─── Notification prefs (JS-friendly keys) ────────────────────

export type NotificationPrefs = {
  weeklyReport:  boolean
  budgetAlerts:  boolean
  goalReminders: boolean
  loginAlerts:   boolean
}

// ─── Profile form schema ──────────────────────────────────────

export const profileSchema = z.object({
  full_name:      z.string().min(2, "at least 2 characters"),
  username:       z.string().min(3, "at least 3 characters")
                    .regex(/^[a-z0-9_]+$/, "lowercase, numbers, underscores only"),
  phone:          z.string().optional(),
  monthly_income: z.number({ error: "must be a number" })
                    .min(0, "must be positive").optional(),
  currency:       z.string().min(1, "required"),
  timezone:       z.string().min(1, "required"),
})

export type ProfileForm = z.infer<typeof profileSchema>

// ─── Update email schema ──────────────────────────────────────

export const updateEmailSchema = z.object({
  email: z.string().min(1, "required").email("invalid email"),
})

export type UpdateEmailForm = z.infer<typeof updateEmailSchema>