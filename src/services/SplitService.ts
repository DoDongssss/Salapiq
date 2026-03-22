import { supabase } from "@/lib/supabaseClient"
import { createTransaction, getAccount, getTransactionById } from "@/services/AccountService"
import type { ExpenseSplit, SplitSummary } from "@/types"

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

  const { error: txnErr } = await supabase
    .from("transactions")
    .update({ is_split: true })
    .eq("id", transactionId)

  if (txnErr) return txnErr.message

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


export async function getTransactionIdsWithSplits(
  transactionIds: string[]
): Promise<Set<string>> {
  if (transactionIds.length === 0) return new Set()
  const { data, error } = await supabase
    .from("expense_splits")
    .select("transaction_id")
    .in("transaction_id", transactionIds)
  if (error || !data?.length) return new Set()
  return new Set(data.map((r) => r.transaction_id as string))
}

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

export async function settleExpenseSplitPayment(
  splitId: string,
  payerUserId: string,
  fromAccountId: string
): Promise<string | null> {
  const { data: split, error: splitErr } = await supabase
    .from("expense_splits")
    .select("*")
    .eq("id", splitId)
    .single()

  if (splitErr || !split) return "Split not found."
  if (split.owed_by !== payerUserId) return "Only the member who owes this amount can settle it."
  if (split.is_settled) return "This split is already settled."

  const origTx = await getTransactionById(split.transaction_id)
  if (!origTx) return "Original expense could not be found."

  const recipientAccountId = origTx.account_id
  if (fromAccountId === recipientAccountId) {
    return "Choose a different account than the one that paid the original expense."
  }

  const fromAccount = await getAccount(fromAccountId)
  if (!fromAccount || fromAccount.user_id !== payerUserId) {
    return "Invalid payer account."
  }
  if (fromAccount.family_id !== split.family_id) {
    return "Pay from a shared family account."
  }

  const toAccount = await getAccount(recipientAccountId)
  if (!toAccount) {
    return "The account used for the original expense could not be found."
  }

  const today = new Date().toISOString().split("T")[0]
  const label = origTx.note ?? split.note ?? "Shared expense"

  const { error: txnErr } = await createTransaction(payerUserId, {
    account_id:    fromAccountId,
    type:          "transfer",
    amount:        split.amount,
    category:      "Split settlement",
    note:          `Split settlement · ${label}`,
    date:          today,
    to_account_id: recipientAccountId,
  })

  if (txnErr) return txnErr

  const settleErr = await settleSplit(splitId)
  if (settleErr) return settleErr

  await supabase.from("notifications").insert({
    user_id: split.created_by,
    title:   "Split payment received",
    message: `₱${split.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })} received toward "${label}".`,
    type:    "info",
    meta:    { split_id: splitId, transaction_id: split.transaction_id },
  })

  return null
}


export async function unsettleSplit(id: string): Promise<string | null> {
  const { error } = await supabase
    .from("expense_splits")
    .update({ is_settled: false, settled_at: null })
    .eq("id", id)

  return error ? error.message : null
}


export async function deleteSplits(transactionId: string): Promise<string | null> {
  const { error } = await supabase
    .from("expense_splits")
    .delete()
    .eq("transaction_id", transactionId)

  return error ? error.message : null
}


export async function getSplitSummary(
  familyId: string,
  userId:   string
): Promise<SplitSummary> {
  const splits = await getFamilySplits(familyId)

  const pending  = splits.filter((s) => !s.is_settled)
  const settled  = splits.filter((s) => s.is_settled)

  const owedToMe = pending
    .filter((s) => s.created_by === userId && s.owed_by !== userId)
    .reduce((sum, s) => sum + s.amount, 0)

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