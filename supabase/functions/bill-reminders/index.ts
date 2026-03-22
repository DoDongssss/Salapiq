// supabase/functions/bill-reminders/index.ts
// Deployed via: supabase functions deploy bill-reminders
// Triggered by: pg_cron daily at 00:00 UTC (8AM PHT)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

Deno.serve(async () => {
  try {
    const today = new Date()

    // Fetch all active recurring transactions
    const { data: entries, error: fetchError } = await supabase
      .from("recurring_transactions")
      .select("id, user_id, note, category, amount, day_of_month, reminder_days, type")
      .eq("is_active", true)

    if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 })
    }

    if (!entries?.length) {
      return new Response(JSON.stringify({ message: "No active recurring entries", created: 0 }), { status: 200 })
    }

    let created = 0

    for (const entry of entries) {
      const reminderDays = entry.reminder_days ?? 3

      for (let daysAhead = 1; daysAhead <= reminderDays; daysAhead++) {
        const targetDate = new Date(today)
        targetDate.setDate(today.getDate() + daysAhead)
        const targetDay = targetDate.getDate()

        if (entry.day_of_month !== targetDay) continue

        // Check if already notified this month
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", entry.user_id)
          .contains("meta", { recurring_id: entry.id })
          .gte("created_at", new Date(today.getFullYear(), today.getMonth(), 1).toISOString())
          .maybeSingle()

        if (existing) continue

        const label   = entry.note ?? entry.category ?? "Bill"
        const ordinal = getOrdinal(entry.day_of_month)
        const amount  = `₱${Number(entry.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`

        const title = daysAhead === 1
          ? `${label} is due tomorrow`
          : `${label} is due in ${daysAhead} days`

        const message = `${amount} ${entry.type === "expense" ? "due" : "expected"} on the ${entry.day_of_month}${ordinal}`

        const { error: insertError } = await supabase
          .from("notifications")
          .insert({
            user_id: entry.user_id,
            title,
            message,
            type: entry.type === "expense" ? "warning" : "info",
            meta: {
              recurring_id: entry.id,
              amount:        entry.amount,
              day_of_month:  entry.day_of_month,
              days_ahead:    daysAhead,
            },
          })

        if (!insertError) created++
      }
    }

    return new Response(
      JSON.stringify({ message: `Bill reminder check complete`, created }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500 }
    )
  }
})

function getOrdinal(n: number): string {
  if ([11, 12, 13].includes(n % 100)) return "th"
  if (n % 10 === 1) return "st"
  if (n % 10 === 2) return "nd"
  if (n % 10 === 3) return "rd"
  return "th"
}