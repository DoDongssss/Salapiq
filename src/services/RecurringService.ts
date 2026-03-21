import { supabase } from "@/lib/supabaseClient"
import type { RecurringTransaction, RecurringForm } from "@/types/RecurringTypes"

export async function getRecurring(userId: string): Promise<RecurringTransaction[]> {
  const { data, error } = await supabase
    .from("recurring_transactions")
    .select(`
      *,
      account:accounts(name, color, icon, type)
    `)
    .eq("user_id", userId)
    .order("day_of_month", { ascending: true })

  if (error) {
    console.error("[getRecurring]", error)
    return []
  }
  return (data ?? []) as RecurringTransaction[]
}

export async function createRecurring(
  userId:  string,
  payload: RecurringForm
): Promise<{ data: RecurringTransaction | null; error: string | null }> {
  const { data, error } = await supabase
    .from("recurring_transactions")
    .insert({
      user_id:      userId,
      account_id:   payload.account_id,
      type:         payload.type,
      amount:       payload.amount,
      category:     payload.category || null,
      note:         payload.note     || null,
      day_of_month: payload.day_of_month,
      is_active:    payload.is_active,
    })
    .select(`*, account:accounts(name, color, icon, type)`)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as RecurringTransaction, error: null }
}

export async function updateRecurring(
  id:      string,
  payload: Partial<RecurringForm>
): Promise<string | null> {
  const { error } = await supabase
    .from("recurring_transactions")
    .update({
      ...(payload.account_id   !== undefined && { account_id:   payload.account_id   }),
      ...(payload.type         !== undefined && { type:         payload.type         }),
      ...(payload.amount       !== undefined && { amount:       payload.amount       }),
      ...(payload.category     !== undefined && { category:     payload.category || null }),
      ...(payload.note         !== undefined && { note:         payload.note     || null }),
      ...(payload.day_of_month !== undefined && { day_of_month: payload.day_of_month }),
      ...(payload.is_active    !== undefined && { is_active:    payload.is_active    }),
    })
    .eq("id", id)

  return error ? error.message : null
}

export async function toggleRecurring(
  id:       string,
  isActive: boolean
): Promise<string | null> {
  const { error } = await supabase
    .from("recurring_transactions")
    .update({ is_active: isActive })
    .eq("id", id)

  return error ? error.message : null
}

export async function deleteRecurring(id: string): Promise<string | null> {
  const { error } = await supabase
    .from("recurring_transactions")
    .delete()
    .eq("id", id)

  return error ? error.message : null
}