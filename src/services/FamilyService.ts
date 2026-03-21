import { supabase } from "@/lib/supabaseClient"
import type {
  Family, FamilyMember, FamilyWithMembers, CreateFamilyForm,
} from "@/types/FamilyTypes"
import type { TransactionWithAccount } from "./AccountService"

export type { Family, FamilyMember, FamilyWithMembers, CreateFamilyForm }

export async function getMyFamily(userId: string): Promise<Family | null> {
  const { data, error } = await supabase
    .from("family_members")
    .select("family_id, families(*)")
    .eq("user_id", userId)
    .maybeSingle()

  if (error || !data) return null

  const row = data as unknown as { family_id: string; families: Family }
  return row.families
}

export async function getFamilyWithMembers(
  familyId: string
): Promise<FamilyWithMembers | null> {
  const { data, error } = await supabase
    .from("families")
    .select(`
      *,
      members:family_members(
        id, user_id, role, joined_at,
        profile:profiles!family_members_user_id_fkey(
          full_name, username, avatar_url, email
        )
      )
    `)
    .eq("id", familyId)
    .maybeSingle()

  if (error || !data) return null
  return data as FamilyWithMembers
}

export async function createFamily(
  payload: CreateFamilyForm
): Promise<{ data: Family | null; error: string | null }> {
  const { data, error } = await supabase.rpc("create_family", {
    p_name:        payload.name,
    p_description: payload.description || null,
    p_currency:    payload.currency    || "PHP",
  })

  if (error) return { data: null, error: error.message }

  const result = data as {
    success?: boolean
    id?:      string
    name?:    string
    error?:   string
  }

  if (result.error) return { data: null, error: result.error }

  const { data: family, error: fetchError } = await supabase
    .from("families")
    .select("*")
    .eq("id", result.id)
    .single()

  if (fetchError) return { data: null, error: fetchError.message }
  return { data: family as Family, error: null }
}

export async function updateFamily(
  familyId: string,
  payload: Partial<CreateFamilyForm>
): Promise<string | null> {
  const { error } = await supabase
    .from("families")
    .update(payload)
    .eq("id", familyId)

  return error ? error.message : null
}

export async function deleteFamily(familyId: string): Promise<string | null> {
  const { error } = await supabase
    .from("families")
    .delete()
    .eq("id", familyId)

  return error ? error.message : null
}

export async function joinFamilyByCode(
  inviteCode: string
): Promise<{ familyId: string | null; familyName: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc("join_family_by_code", {
    p_invite_code: inviteCode.toUpperCase(),
  })

  if (error) return { familyId: null, familyName: null, error: error.message }

  const result = data as {
    success?:     boolean
    family_id?:   string
    family_name?: string
    error?:       string
  }

  if (result.error) return { familyId: null, familyName: null, error: result.error }

  return {
    familyId:   result.family_id   ?? null,
    familyName: result.family_name ?? null,
    error: null,
  }
}

export async function regenerateInviteCode(
  familyId: string
): Promise<{ code: string | null; error: string | null }> {
  const newCode = Math.random().toString(36).substring(2, 10).toUpperCase()

  const { error } = await supabase
    .from("families")
    .update({ invite_code: newCode })
    .eq("id", familyId)

  if (error) return { code: null, error: error.message }
  return { code: newCode, error: null }
}

export async function removeMember(
  familyId: string,
  userId: string
): Promise<string | null> {
  const { error } = await supabase
    .from("family_members")
    .delete()
    .eq("family_id", familyId)
    .eq("user_id", userId)

  return error ? error.message : null
}

export async function updateMemberRole(
  familyId: string,
  userId: string,
  role: "admin" | "member"
): Promise<string | null> {
  const { error } = await supabase
    .from("family_members")
    .update({ role })
    .eq("family_id", familyId)
    .eq("user_id", userId)

  return error ? error.message : null
}

export async function leaveFamily(
  familyId: string,
  userId: string
): Promise<string | null> {
  const { error } = await supabase
    .from("family_members")
    .delete()
    .eq("family_id", familyId)
    .eq("user_id", userId)

  return error ? error.message : null
}

export async function getFamilyAccounts(familyId: string) {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("family_id", familyId)
    .eq("is_active", true)
    .order("created_at", { ascending: true })

  if (error) return []
  return data
}

export async function linkAccountToFamily(
  accountId: string,
  familyId: string
): Promise<string | null> {
  const { error } = await supabase
    .from("accounts")
    .update({ family_id: familyId })
    .eq("id", accountId)

  return error ? error.message : null
}

export async function unlinkAccountFromFamily(
  accountId: string
): Promise<string | null> {
  const { error } = await supabase
    .from("accounts")
    .update({ family_id: null })
    .eq("id", accountId)

  return error ? error.message : null
}

export type FamilyTransactionFilters = {
  type?:     "income" | "expense" | "transfer"
  search?:   string
  page?:     number
  pageSize?: number
}
 
export type PaginatedFamilyTransactions = {
  data:       TransactionWithAccount[]
  total:      number
  totalPages: number
  page:       number
  pageSize:   number
}
 
export async function getFamilyTransactions(
  familyId: string,
  filters:  FamilyTransactionFilters = {}
): Promise<PaginatedFamilyTransactions> {
  const {
    type,
    search,
    page     = 1,
    pageSize = 10,
  } = filters
 
  const { data: sharedAccounts } = await supabase
    .from("accounts")
    .select("id")
    .eq("family_id", familyId)
    .eq("is_active", true)
 
  if (!sharedAccounts || sharedAccounts.length === 0) {
    return { data: [], total: 0, totalPages: 0, page, pageSize }
  }
 
  const sharedAccountIds = sharedAccounts.map((a) => a.id)
  const from_idx         = (page - 1) * pageSize
  const to_idx           = from_idx + pageSize - 1
 
  let query = supabase
    .from("transactions")
    .select(
      `*,
      account:accounts!transactions_account_id_fkey(name, color, icon, type, family_id),
      to_account:accounts!transactions_to_account_id_fkey(name, color, icon, type)`,
      { count: "exact" }
    )
    .in("account_id", sharedAccountIds)
    .order("date",       { ascending: false })
    .order("created_at", { ascending: false })
    .range(from_idx, to_idx)
 
  if (type)   query = query.eq("type", type)
  if (search?.trim()) {
    query = query.or(`note.ilike.%${search.trim()}%,category.ilike.%${search.trim()}%`)
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