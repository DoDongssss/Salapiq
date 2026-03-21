 
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
 
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)
 
Deno.serve(async () => {
  try {
    const now          = new Date()
const today        = now.toISOString().split("T")[0]       // e.g. "2026-03-21"
    const dayOfMonth   = now.getDate()                          // e.g. 21
    const currentMonth = now.getMonth() + 1
    const currentYear  = now.getFullYear()

    // ── 1. Fetch all active recurring entries due today ──────
    const { data: entries, error: fetchError } = await supabase
      .from("recurring_transactions")
      .select("*, account:accounts(name, balance)")
      .eq("is_active", true)
      .eq("day_of_month", dayOfMonth)

    if (fetchError) throw fetchError
    if (!entries || entries.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: "No entries due today" }), {
        headers: { "Content-Type": "application/json" },
      })
    }

    let processed = 0
    let skipped   = 0
    const errors: string[] = []

    for (const entry of entries) {
      try {
        // ── 2. Skip if already ran this month ───────────────
        if (entry.last_run_at) {
          const lastRun    = new Date(entry.last_run_at)
          const lastMonth  = lastRun.getMonth() + 1
          const lastYear   = lastRun.getFullYear()
          if (lastMonth === currentMonth && lastYear === currentYear) {
            skipped++
            continue
          }
        }

        // ── 3. Check sufficient balance for expense ─────────
        if (entry.type === "expense" && entry.account.balance < entry.amount) {
          // notify user about insufficient balance
          await supabase.from("notifications").insert({
            user_id: entry.user_id,
            type:    "transaction",
            title:   "Recurring payment skipped",
            message: `${entry.note ?? entry.category ?? "Recurring expense"} of ₱${entry.amount.toLocaleString()} could not be processed — insufficient balance in ${entry.account.name}.`,
            link:    "/app/transactions",
          })
          skipped++
          continue
        }

        // ── 4. Insert the transaction ────────────────────────
        const { error: txnError } = await supabase
          .from("transactions")
          .insert({
            user_id:    entry.user_id,
            account_id: entry.account_id,
            type:       entry.type,
            amount:     entry.amount,
            category:   entry.category,
            note:       entry.note ?? `Auto: ${entry.note ?? entry.category ?? "Recurring"}`,
            date:       today,
          })

        if (txnError) throw new Error(`Transaction insert failed: ${txnError.message}`)

        // ── 5. Mark last_run_at ──────────────────────────────
        await supabase
          .from("recurring_transactions")
          .update({ last_run_at: today })
          .eq("id", entry.id)

        // ── 6. Notify the user ───────────────────────────────
        const typeLabel   = entry.type === "income" ? "received" : "deducted"
        const amountLabel = `₱${Number(entry.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
        const entryLabel  = entry.note ?? entry.category ?? "Recurring transaction"

        await supabase.from("notifications").insert({
          user_id: entry.user_id,
          type:    "transaction",
          title:   `${entryLabel} processed`,
          message: `${amountLabel} ${typeLabel} automatically ${entry.type === "income" ? "to" : "from"} ${entry.account.name}.`,
          link:    "/app/transactions",
        })

        processed++
      } catch (entryError) {
        errors.push(`[${entry.id}] ${(entryError as Error).message}`)
      }
    }

    return new Response(
      JSON.stringify({ processed, skipped, errors, today }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})