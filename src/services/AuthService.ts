import { supabase } from "@/lib/supabaseClient"

export type AuthError = string | null

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = {
  full_name: string
  email: string
  password: string
}

export async function loginWithEmail(
  payload: LoginPayload
): Promise<AuthError> {
  const { error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  })

  if (!error) return null

  if (error.message.toLowerCase().includes("email not confirmed")) {
    return "EMAIL_NOT_CONFIRMED"
  }
  if (error.message.toLowerCase().includes("invalid login credentials")) {
    return "Incorrect email or password."
  }

  return error.message
}


export async function registerWithEmail(
  payload: RegisterPayload
): Promise<AuthError> {
  const { error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: { full_name: payload.full_name },
    },
  })

  if (!error) return null

  if (error.message.toLowerCase().includes("already registered")) {
    return "An account with this email already exists."
  }

  return error.message
}

export async function sendPasswordResetEmail(
  email: string
): Promise<AuthError> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })

  if (!error) return null

  return error.message
}

export async function updatePassword(
  newPassword: string
): Promise<AuthError> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (!error) return null

  return error.message
}


export async function resendVerificationEmail(
  email: string
): Promise<AuthError> {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
  })

  if (!error) return null

  return error.message
}

export async function loginWithGoogle(): Promise<AuthError> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (!error) return null

  return error.message
}

export async function logout(): Promise<AuthError> {
  const { error } = await supabase.auth.signOut()

  if (!error) return null

  return error.message
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  if (error) return null
  return data.session
}


export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()
  if (error) return null
  return data.user
}