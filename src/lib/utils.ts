import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string): string {
  const d         = new Date(dateStr + "T00:00:00")
  const today     = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (d.toDateString() === today.toDateString())     return "Today"
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday"

  return d.toLocaleDateString("en-PH", {
    month: "short",
    day:   "numeric",
    year:  "numeric",
  })
}

export function formatShortDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-PH", {
    month: "short",
    day:   "numeric",
  })
}

export function currentMonthLabel(): string {
  return new Date().toLocaleDateString("en-PH", {
    month: "long",
    year:  "numeric",
  })
}