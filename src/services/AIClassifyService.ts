import { supabase } from "@/lib/supabaseClient"
import type { TransactionWithAccount } from "@/services/AccountService"
import type { AIClassification, AIAccuracyStats } from "@/types/AIClassifyTypes"
import { classifyByKeyword } from "@/types/AIClassifyTypes"

// ─── Fetch unclassified transactions ─────────────────────────

export async function getUnclassified(
  userId: string,
  limit = 20
): Promise<TransactionWithAccount[]> {
  const { data, error } = await supabase
    .from("transactions")
    .select(`
      *,
      account:accounts!transactions_account_id_fkey(name, color, icon, type),
      to_account:accounts!transactions_to_account_id_fkey(name, color, icon, type)
    `)
    .eq("user_id", userId)
    .eq("type", "expense")
    .is("category", null)
    .not("note", "is", null)
    .order("date", { ascending: false })
    .limit(limit)

  if (error) return []
  return data as TransactionWithAccount[]
}

// ─── Apply category to a transaction ─────────────────────────

export async function applyCategory(
  transactionId:     string,
  userId:            string,
  note:              string,
  acceptedCategory:  string,
  suggestedCategory: string | null,
): Promise<string | null> {
  // Update transaction category
  const { error: txnError } = await supabase
    .from("transactions")
    .update({ category: acceptedCategory, updated_at: new Date().toISOString() })
    .eq("id", transactionId)

  if (txnError) return txnError.message

  // Log to ai_classifications for pattern learning
  const wasCorrect = acceptedCategory === suggestedCategory

  await supabase
    .from("ai_classifications")
    .insert({
      user_id:             userId,
      note:                note.toLowerCase().trim(),
      suggested_category:  suggestedCategory,
      accepted_category:   acceptedCategory,
      was_correct:         wasCorrect,
      transaction_id:      transactionId,
    })

  return null
}

// ─── Skip a transaction (dismiss without categorizing) ────────

export async function skipTransaction(
  transactionId: string
): Promise<string | null> {
  // Mark with a placeholder so it leaves the queue
  const { error } = await supabase
    .from("transactions")
    .update({ ai_suggested: true, updated_at: new Date().toISOString() })
    .eq("id", transactionId)

  return error ? error.message : null
}

// ─── Pattern matching from user's own correction history ──────

export async function classifyByPattern(
  userId: string,
  note:   string
): Promise<{ category: string | null; confidence: number }> {
  if (!note?.trim()) return { category: null, confidence: 0 }

  const lower = note.toLowerCase().trim()

  // Find past accepted classifications where the note is similar
  const { data, error } = await supabase
    .from("ai_classifications")
    .select("accepted_category, note")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200)

  if (error || !data?.length) return { category: null, confidence: 0 }

  // Exact match first
  const exact = data.find((c) => c.note === lower)
  if (exact) return { category: exact.accepted_category, confidence: 0.98 }

  // Partial match — note contains a past note or vice versa
  const partial = data.find(
    (c) => lower.includes(c.note) || c.note.includes(lower)
  )
  if (partial) return { category: partial.accepted_category, confidence: 0.82 }

  // Word overlap
  const inputWords = lower.split(/\s+/).filter((w) => w.length > 2)
  let bestScore    = 0
  let bestCategory: string | null = null

  for (const c of data) {
    const pastWords = c.note.split(/\s+/).filter((w: string) => w.length > 2)
    const overlap   = inputWords.filter((w) => pastWords.includes(w)).length
    const score     = overlap / Math.max(inputWords.length, pastWords.length)
    if (score > bestScore && score > 0.4) {
      bestScore    = score
      bestCategory = c.accepted_category
    }
  }

  return { category: bestCategory, confidence: bestScore * 0.75 }
}

// ─── Get classification history ───────────────────────────────

export async function getClassificationHistory(
  userId: string,
  limit  = 30
): Promise<AIClassification[]> {
  const { data, error } = await supabase
    .from("ai_classifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) return []
  return data as AIClassification[]
}

// ─── Get accuracy stats ───────────────────────────────────────

export async function getAccuracyStats(
  userId: string
): Promise<AIAccuracyStats | null> {
  const { data, error } = await supabase
    .from("ai_accuracy_stats")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (error || !data) return null
  return data as AIAccuracyStats
}

// ─── Classify a single note using all methods ─────────────────

export async function classifyNote(
  userId: string,
  note:   string
): Promise<{ category: string | null; confidence: number; source: "pattern" | "keyword" | "none" }> {
  // 1. Try pattern matching from history first
  const pattern = await classifyByPattern(userId, note)
  if (pattern.category && pattern.confidence > 0.7) {
    return { ...pattern, source: "pattern" }
  }

  // 2. Try keyword matching
  const keyword = classifyByKeyword(note)
  if (keyword.category) {
    return { ...keyword, source: "keyword" }
  }

  // 3. Pattern match with lower threshold
  if (pattern.category) {
    return { ...pattern, source: "pattern" }
  }

  return { category: null, confidence: 0, source: "none" }
}