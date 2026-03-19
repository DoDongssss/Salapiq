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
  financial_goal: string | null
  ai_opt_in:      boolean
  ai_persona:     Record<string, unknown> | null
  is_active:      boolean
  is_verified:    boolean
  last_login_at:  string | null
  deleted_at:     string | null
  created_at:     string
  updated_at:     string
}