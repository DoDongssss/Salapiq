import { supabase } from "@/lib/supabaseClient"

export type NotificationType = "transaction" | "budget" | "family" | "system"

export type Notification = {
  id:         string
  user_id:    string
  type:       NotificationType
  title:      string
  message:    string
  read:       boolean
  link:       string | null
  created_at: string
}

export async function getNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) return []
  return data as Notification[]
}

export async function markAsRead(id: string): Promise<void> {
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id)
}

export async function markAllAsRead(userId: string): Promise<void> {
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false)
}

export async function deleteNotification(id: string): Promise<void> {
  await supabase
    .from("notifications")
    .delete()
    .eq("id", id)
}

export async function clearAllNotifications(userId: string): Promise<void> {
  await supabase
    .from("notifications")
    .delete()
    .eq("user_id", userId)
}

export async function createNotification(
  userId: string,
  payload: {
    type:    NotificationType
    title:   string
    message: string
    link?:   string
  }
): Promise<void> {
  await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      type:    payload.type,
      title:   payload.title,
      message: payload.message,
      link:    payload.link || null,
    })
}