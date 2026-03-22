import { z } from "zod"


export type ExpenseSplit = {
  id:             string
  transaction_id: string
  family_id:      string
  created_by:     string
  owed_by:        string
  amount:         number
  is_settled:     boolean
  settled_at:     string | null
  note:           string | null
  created_at:     string
  updated_at:     string
  owed_by_profile?: { full_name: string | null; avatar_url: string | null; username: string | null }
  transaction?:     { note: string | null; amount: number; date: string; category: string | null }
}

export type SplitSummary = {
  totalOwedToMe:   number  
  totalIOwe:       number   
  netBalance:      number   
  pendingSplits:   ExpenseSplit[]
  settledSplits:   ExpenseSplit[]
}


export type SplitMember = {
  userId:   string
  fullName: string | null
  avatar:   string | null
  amount:   number
  included: boolean
}

export const splitSchema = z.object({
  members: z.array(z.object({
    userId:   z.string(),
    amount:   z.number().min(0),
    included: z.boolean(),
  })).min(1),
  note: z.string().optional(),
})

export type SplitForm = z.infer<typeof splitSchema>

export type SplitMode = "equal" | "custom" | "percentage"