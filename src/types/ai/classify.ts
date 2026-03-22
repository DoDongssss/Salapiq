import { z } from "zod"
import type { TransactionWithAccount } from "../finance/account"

export type AIClassification = {
  id:                  string
  user_id:             string
  note:                string
  suggested_category:  string | null
  accepted_category:   string
  was_correct:         boolean
  transaction_id:      string | null
  created_at:          string
}

export type AIAccuracyStats = {
  user_id:           string
  total_classified:  number
  correct:           number
  accuracy_percent:  number
  last_classified_at: string | null
}

export type ClassifyQueueItem = {
  transaction:         TransactionWithAccount
  suggestedCategory:   string | null
  confidence:          number
  source:              "pattern" | "keyword" | "model" | "none"
}

export const applyClassificationSchema = z.object({
  category: z.string().min(1, "required"),
})

export type ApplyClassificationForm = z.infer<typeof applyClassificationSchema>

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Food & Dining": [
    "jollibee", "mcdo", "mcdonald", "kfc", "burger king", "chowking",
    "mang inasal", "greenwich", "pizza hut", "shakeys", "starbucks",
    "7-eleven", "711", "ministop", "familymart", "grocery", "SM",
    "robinsons", "puregold", "savemore", "food", "restaurant",
    "cafe", "coffee", "lunch", "dinner", "breakfast", "snack",
    "delivery", "foodpanda", "grab food", "grabfood",
  ],
  "Transportation": [
    "grab", "angkas", "ltfrb", "lrt", "mrt", "bus", "jeep", "jeepney",
    "tricycle", "taxi", "uber", "fare", "toll", "gasoline", "gas",
    "petron", "shell", "caltex", "parking", "transport",
  ],
  "Shopping": [
    "shopee", "lazada", "zalora", "shein", "uniqlo", "h&m", "bench",
    "sm store", "department store", "mall", "amazon", "online shop",
    "purchase", "bought", "order",
  ],
  "Entertainment": [
    "netflix", "spotify", "youtube", "disney", "hbo", "prime",
    "steam", "mobile legends", "cinema", "movie", "concert",
    "subscription", "gaming", "games", "arcade",
  ],
  "Utilities": [
    "meralco", "electric", "water", "maynilad", "manila water",
    "pldt", "globe", "smart", "converge", "internet", "wifi",
    "load", "bill", "phone bill", "cable",
  ],
  "Health": [
    "mercury", "watsons", "pharmacy", "medicine", "doctor", "hospital",
    "clinic", "lab", "dental", "check up", "vitamins", "health",
    "medic", "consultation",
  ],
  "Education": [
    "tuition", "school", "university", "college", "books", "supplies",
    "enrollment", "allowance", "review", "course", "udemy", "coursera",
  ],
  "Housing": [
    "rent", "condo", "apartment", "landlord", "association dues",
    "hoa", "maintenance", "repair", "plumber", "electrician",
  ],
  "Personal Care": [
    "salon", "barber", "haircut", "spa", "massage", "nail",
    "beauty", "cosmetics", "skin care", "lotion", "shampoo",
  ],
  "Savings": [
    "savings", "investment", "stock", "mutual fund", "insurance",
    "sss", "pagibig", "philhealth", "contribution",
  ],
}

export function classifyByKeyword(note: string): { category: string | null; confidence: number } {
  if (!note?.trim()) return { category: null, confidence: 0 }

  const lower  = note.toLowerCase()
  let bestMatch: string | null = null
  let bestScore = 0

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        const score = kw.length / lower.length
        if (score > bestScore) {
          bestScore  = score
          bestMatch  = category
        }
      }
    }
  }

  return {
    category:   bestMatch,
    confidence: bestMatch ? Math.min(0.5 + bestScore * 2, 0.95) : 0,
  }
}
