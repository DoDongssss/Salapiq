import { supabase } from "@/lib/supabaseClient"
import type { Account, AccountForm, Transaction, TransactionForm } from "@/types/AccountTypes"

export async function getAccounts(userId: string): Promise<Account[]> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
  if (error) return []
  return data as Account[]
}

export async function getAccount(id: string): Promise<Account | null> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", id)
    .single()
  if (error) return null
  return data as Account
}

export async function createAccount(
  userId: string,
  payload: AccountForm,
  familyId?: string
): Promise<{ data: Account | null; error: string | null }> {
  const { data, error } = await supabase
    .from("accounts")
    .insert({
      user_id:   userId,
      family_id: familyId || null,
      name:      payload.name,
      type:      payload.type,
      provider:  payload.provider || null,
      balance:   payload.balance  || 0,
      currency:  payload.currency,
      color:     payload.color,
      icon:      payload.icon,
    })
    .select()
    .single()
  if (error) return { data: null, error: error.message }
  return { data: data as Account, error: null }
}

export async function updateAccount(
  id: string,
  payload: Partial<AccountForm>
): Promise<string | null> {
  const { error } = await supabase
    .from("accounts")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (!error) return null
  return error.message
}

export async function deleteAccount(id: string): Promise<string | null> {
  // Soft delete — set is_active = false
  const { error } = await supabase
    .from("accounts")
    .update({ is_active: false })
    .eq("id", id)
  if (!error) return null
  return error.message
}

export function getTotalBalance(accounts: Account[]): number {
  return accounts.reduce((sum, a) => sum + a.balance, 0)
}

export type TransactionWithAccount = Transaction & {
  account:    Pick<Account, "name" | "color" | "icon" | "type">
  to_account: Pick<Account, "name" | "color" | "icon" | "type"> | null
  member?:    { full_name: string; avatar_url: string | null } | null
}

export type TransactionFilters = {
  type?:     "income" | "expense" | "transfer"
  from?:     string
  to?:       string
  search?:   string
  page?:     number
  pageSize?: number
}
 
export type PaginatedTransactions = {
  data:       TransactionWithAccount[]
  total:      number
  totalPages: number
  page:       number
  pageSize:   number
}
 
export async function getTransactions(
  userId:  string,
  filters: TransactionFilters = {}
): Promise<PaginatedTransactions> {
  const {
    type,
    from,
    to,
    search,
    page     = 1,
    pageSize = 10,
  } = filters
 
  const from_idx = (page - 1) * pageSize
  const to_idx   = from_idx + pageSize - 1
 
  let query = supabase
    .from("transactions")
    .select(
      `*,
      account:accounts!transactions_account_id_fkey(name, color, icon, type),
      to_account:accounts!transactions_to_account_id_fkey(name, color, icon, type)`,
      { count: "exact" }  
    )
    .eq("user_id", userId)
    .order("date",       { ascending: false })
    .order("created_at", { ascending: false })
    .range(from_idx, to_idx)  
 
  if (type)   query = query.eq("type", type)
  if (from)   query = query.gte("date", from)
  if (to)     query = query.lte("date", to)
 
  if (search?.trim()) {
    query = query.or(
      `note.ilike.%${search.trim()}%,category.ilike.%${search.trim()}%`
    )
  }
 
  const { data, error, count } = await query
 
  if (error) return { data: [], total: 0, totalPages: 0, page, pageSize }
 
  const total      = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
 
  return {
    data:       (data ?? []) as TransactionWithAccount[],
    total,
    totalPages,
    page,
    pageSize,
  }
}

export async function createTransaction(
  userId: string,
  payload: TransactionForm
): Promise<{ data: Transaction | null; error: string | null }> {

  if (payload.type === "transfer") {
    if (!payload.amount) return { data: null, error: "Amount is required." }

    const account = await getAccount(payload.account_id)
    if (!account) return { data: null, error: "Account not found." }
    if (payload.amount > account.balance) {
      return { data: null, error: `Insufficient balance. Available: ₱${account.balance.toLocaleString()}` }
    }
    if (!payload.to_account_id) {
      return { data: null, error: "Please select a destination account." }
    }
    if (payload.account_id === payload.to_account_id) {
      return { data: null, error: "Cannot transfer to the same account." }
    }
  }

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id:       userId,
      account_id:    payload.account_id,
      amount:        payload.amount,
      type:          payload.type,
      category:      payload.category   || null,
      note:          payload.note       || null,
      date:          payload.date,
      to_account_id: payload.type === "transfer"
                       ? payload.to_account_id || null
                       : null,
    })
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Transaction, error: null }
}

export async function updateTransaction(
  id: string,
  payload: Partial<TransactionForm>
): Promise<string | null> {
  const { error } = await supabase
    .from("transactions")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
  if (!error) return null
  return error.message
}

export async function deleteTransaction(id: string): Promise<string | null> {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
  if (!error) return null
  return error.message
}

export async function getMonthSummary(
  userId: string,
  month: number,
  year: number
): Promise<{ income: number; expenses: number; net: number }> {
  const from = `${year}-${String(month).padStart(2, "0")}-01`
  const to   = new Date(year, month, 0).toISOString().split("T")[0]

  const { data } = await supabase
    .from("transactions")
    .select("amount, type")
    .eq("user_id", userId)
    .neq("type", "transfer")
    .gte("date", from)
    .lte("date", to)

  if (!data) return { income: 0, expenses: 0, net: 0 }

  const income   = data.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const expenses = data.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)

  return { income, expenses, net: income - expenses }
}