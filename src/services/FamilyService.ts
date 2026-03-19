import { supabase } from "@/lib/supabaseClient"

export type Family = {
  id:          string
  name:        string
  description: string | null
  invite_code: string
  created_by:  string
  avatar_url:  string | null
  currency:    string
  created_at:  string
  updated_at:  string
}

export type FamilyMember = {
  id:        string
  family_id: string
  user_id:   string
  role:      "admin" | "member"
  joined_at: string
  profile: {
    full_name:  string
    username:   string | null
    avatar_url: string | null
    email:      string | null
  }
}

export type FamilyWithMembers = Family & {
  members: FamilyMember[]
}

export type CreateFamilyForm = {
  name:         string
  description?: string
  currency?:    string
}

export async function getMyFamily(userId: string): Promise<Family | null> {
  const { data, error } = await supabase
    .from("family_members")
    .select("family_id, families(*)")
    .eq("user_id", userId)
    .maybeSingle()

  if (error || !data) return null
  return (data as any).families as Family
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
        profile:profiles(full_name, username, avatar_url, email)
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

export async function getFamilyTransactions(
  familyId: string,
  options?: { limit?: number; from?: string; to?: string }
) {
  const { data: sharedAccounts } = await supabase
    .from("accounts")
    .select("id")
    .eq("family_id", familyId)
    .eq("is_active", true)

  if (!sharedAccounts || sharedAccounts.length === 0) return []

  const sharedAccountIds = sharedAccounts.map((a) => a.id)

  let query = supabase
    .from("transactions")
    .select(`
      *,
      account:accounts!transactions_account_id_fkey(name, color, icon, type, family_id),
      to_account:accounts!transactions_to_account_id_fkey(name, color, icon, type)
    `)
    .in("account_id", sharedAccountIds)
    .order("date",       { ascending: false })
    .order("created_at", { ascending: false })

  if (options?.from)  query = query.gte("date", options.from)
  if (options?.to)    query = query.lte("date", options.to)
  if (options?.limit) query = query.limit(options.limit)

  const { data, error } = await query
  if (error) return []
  return data
}