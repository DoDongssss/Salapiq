import { z } from "zod"

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

export const createFamilySchema = z.object({
  name:        z.string().min(1, "required").min(2, "at least 2 characters"),
  description: z.string().optional(),
  currency:    z.string().optional(),
})

export type CreateFamilyForm = z.infer<typeof createFamilySchema>