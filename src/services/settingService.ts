import { supabase } from "@/lib/supabaseClient"
import { sendPasswordResetEmail } from "@/services/AuthService"
import type {
  Profile, UserSettingsRow,
  NotificationPrefs, ProfileForm,
} from "@/schemas/Setting"

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()                      

  if (error) {
    console.error("[getProfile]", error)
    return null
  }
  return data as Profile | null
}

export async function updateProfile(
  userId: string,
  payload: ProfileForm
): Promise<string | null> {
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name:      payload.full_name,
      username:       payload.username,
      phone:          payload.phone          || null,
      monthly_income: payload.monthly_income || null,
      currency:       payload.currency,
      timezone:       payload.timezone,
      updated_at:     new Date().toISOString(),
    })
    .eq("id", userId)

  if (!error) return null
  if (error.code === "23505") return "USERNAME_TAKEN"
  return error.message
}

export async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ url: string | null; error: string | null }> {
  const ext  = file.name.split(".").pop()
  const path = `${userId}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true })

  if (uploadError) return { url: null, error: uploadError.message }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path)

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: data.publicUrl })
    .eq("id", userId)

  if (updateError) return { url: null, error: updateError.message }
  return { url: data.publicUrl, error: null }
}

export async function updateEmail(newEmail: string): Promise<string | null> {
  const { error } = await supabase.auth.updateUser({ email: newEmail })
  return error ? error.message : null
}

export async function resendVerificationEmail(
  email: string
): Promise<string | null> {
  const { error } = await supabase.auth.resend({ type: "signup", email })
  return error ? error.message : null
}

export async function resetPassword(email: string): Promise<string | null> {
  return sendPasswordResetEmail(email)
}

export async function getUserSettings(
  userId: string
): Promise<UserSettingsRow | null> {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("id", userId)
    .maybeSingle()               

  if (error) {
    console.error("[getUserSettings]", error)
    return null
  }
  return data as UserSettingsRow | null
}

export async function updateUserSettings(
  userId: string,
  payload: Partial<UserSettingsRow>
): Promise<string | null> {
  const { error } = await supabase
    .from("user_settings")
    .upsert({ id: userId, ...payload }, { onConflict: "id" })
    .eq("id", userId)

  return error ? error.message : null
}

export function extractNotificationPrefs(
  settings: UserSettingsRow | null
): NotificationPrefs {
  if (!settings) {
    return {
      weeklyReport: true, budgetAlerts: true,
      goalReminders: true, loginAlerts: true,
    }
  }
  return {
    weeklyReport:  settings.notif_weekly_report,
    budgetAlerts:  settings.notif_budget_alerts,
    goalReminders: settings.notif_goal_reminders,
    loginAlerts:   settings.notif_login_alerts,
  }
}

export async function saveNotificationPrefs(
  userId: string,
  prefs: NotificationPrefs
): Promise<string | null> {
  return updateUserSettings(userId, {
    notif_weekly_report:  prefs.weeklyReport,
    notif_budget_alerts:  prefs.budgetAlerts,
    notif_goal_reminders: prefs.goalReminders,
    notif_login_alerts:   prefs.loginAlerts,
  })
}

export async function updateAiOptIn(
  userId: string,
  value: boolean
): Promise<string | null> {
  const [r1, r2] = await Promise.all([
    supabase.from("profiles").update({ ai_opt_in: value }).eq("id", userId),
    updateUserSettings(userId, { ai_opt_in: value }),
  ])
  if (r1.error) return r1.error.message
  if (r2)       return r2
  return null
}

export function clearLocalAiData(): void {
  localStorage.removeItem("salapiq-ai-feedback")
}

export async function updateAppPreferences(
  userId: string,
  prefs: { theme?: string; language?: string; date_format?: string }
): Promise<string | null> {
  return updateUserSettings(userId, prefs)
}


export async function deactivateAccount(): Promise<string | null> {
  return "CONTACT_SUPPORT"
}

export async function deleteAccount(): Promise<string | null> {
  return "CONTACT_SUPPORT"
}