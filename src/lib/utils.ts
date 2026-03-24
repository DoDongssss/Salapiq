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

export function formatCurrency(value: number, currency: string) {
  const abs = Math.abs(value)

  if (abs >= 1_000_000_000) {
    return `${currency}${(value / 1_000_000_000).toFixed(2)}B`
  }
  if (abs >= 1_000_000) {
    return `${currency}${(value / 1_000_000).toFixed(2)}M`
  }
  if (abs >= 1_000) {
    return `${currency}${(value / 1_000).toFixed(2)}K`
  }

  return `${currency}${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
  })}`
}