import { supabase } from "@/lib/supabaseClient"
import type { ExpenseSplit, SplitSummary } from "@/types/SplitTypes"

// ─── Create splits ────────────────────────────────────────────

export async function createSplits(
  transactionId: string,
  familyId:      string,
  createdBy:     string,
  splits: { userId: string; amount: number }[],
  note?: string
): Promise<string | null> {
  const rows = splits.map((s) => ({
    transaction_id: transactionId,
    family_id:      familyId,
    created_by:     createdBy,
    owed_by:        s.userId,
    amount:         s.amount,
    note:           note || null,
  }))

  const { error } = await supabase
    .from("expense_splits")
    .insert(rows)

  if (error) return error.message

  await supabase
    .from("transactions")
    .update({ is_split: true })
    .eq("id", transactionId)

  const totalAmount = splits.reduce((sum, s) => sum + s.amount, 0)
  await supabase
    .from("notifications")
    .insert({
      user_id: createdBy,
      title:   "Split created",
      message: `₱${totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })} split with ${splits.length} member${splits.length > 1 ? "s" : ""}`,
      type:    "info",
      meta:    { transaction_id: transactionId },
    })

  return null
}

// ─── Get splits for a family ──────────────────────────────────

export async function getFamilySplits(
  familyId:    string,
  isSettled?:  boolean
): Promise<ExpenseSplit[]> {
  let query = supabase
    .from("expense_splits")
    .select(`
      *,
      owed_by_profile:profiles!expense_splits_owed_by_fkey(full_name, avatar_url, username),
      transaction:transactions!expense_splits_transaction_id_fkey(note, amount, date, category)
    `)
    .eq("family_id", familyId)
    .order("created_at", { ascending: false })

  if (isSettled !== undefined) {
    query = query.eq("is_settled", isSettled)
  }

  const { data, error } = await query
  if (error) return []
  return data as ExpenseSplit[]
}

// ─── Get splits for a specific transaction ────────────────────

export async function getTransactionSplits(
  transactionId: string
): Promise<ExpenseSplit[]> {
  const { data, error } = await supabase
    .from("expense_splits")
    .select(`
      *,
      owed_by_profile:profiles!expense_splits_owed_by_fkey(full_name, avatar_url, username)
    `)
    .eq("transaction_id", transactionId)

  if (error) return []
  return data as ExpenseSplit[]
}

// ─── Settle a split ───────────────────────────────────────────

export async function settleSplit(id: string): Promise<string | null> {
  const { error } = await supabase
    .from("expense_splits")
    .update({
      is_settled: true,
      settled_at: new Date().toISOString(),
    })
    .eq("id", id)

  return error ? error.message : null
}

// ─── Unsettled a split ────────────────────────────────────────

export async function unsettleSplit(id: string): Promise<string | null> {
  const { error } = await supabase
    .from("expense_splits")
    .update({ is_settled: false, settled_at: null })
    .eq("id", id)

  return error ? error.message : null
}

// ─── Delete splits for a transaction ─────────────────────────

export async function deleteSplits(transactionId: string): Promise<string | null> {
  const { error } = await supabase
    .from("expense_splits")
    .delete()
    .eq("transaction_id", transactionId)

  return error ? error.message : null
}

// ─── Get split summary for current user ──────────────────────

export async function getSplitSummary(
  familyId: string,
  userId:   string
): Promise<SplitSummary> {
  const splits = await getFamilySplits(familyId)

  const pending  = splits.filter((s) => !s.is_settled)
  const settled  = splits.filter((s) => s.is_settled)

  // Splits others owe me (I created, they owe)
  const owedToMe = pending
    .filter((s) => s.created_by === userId && s.owed_by !== userId)
    .reduce((sum, s) => sum + s.amount, 0)

  // Splits I owe others (they created, I owe)
  const iOwe = pending
    .filter((s) => s.owed_by === userId && s.created_by !== userId)
    .reduce((sum, s) => sum + s.amount, 0)

  return {
    totalOwedToMe: owedToMe,
    totalIOwe:     iOwe,
    netBalance:    owedToMe - iOwe,
    pendingSplits: pending,
    settledSplits: settled,
  }
}