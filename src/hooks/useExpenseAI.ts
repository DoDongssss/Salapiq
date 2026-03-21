import { useState, useEffect, useCallback, useRef } from "react"

export type ExpenseCategory =
  | "Food & Dining"
  | "Transportation"
  | "Shopping"
  | "Utilities"
  | "Healthcare"
  | "Entertainment"
  | "Education"
  | "Savings"
  | "Other"

export const CATEGORIES: ExpenseCategory[] = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Utilities",
  "Healthcare",
  "Entertainment",
  "Education",
  "Savings",
  "Other",
]

type AIStatus = "idle" | "loading" | "ready" | "error"

type PredictionResult = {
  category: ExpenseCategory
  confidence: number
} | null

const FEEDBACK_KEY = "salapiq-ai-feedback"
type FeedbackEntry = { text: string; category: string }

function loadFeedback(): FeedbackEntry[] {
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveFeedback(entries: FeedbackEntry[]) {
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(entries))
}

function checkFeedback(text: string): PredictionResult | null {
  const feedback = loadFeedback()
  const match = feedback.find(
    (f) => f.text.toLowerCase() === text.toLowerCase()
  )
  if (match) return { category: match.category as ExpenseCategory, confidence: 99 }
  return null
}

export function useExpenseAI() {
  const [status, setStatus] = useState<AIStatus>("idle")
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [prediction, setPrediction] = useState<PredictionResult>(null)

  const workerRef = useRef<Worker | null>(null)
  const pendingRef = useRef<Map<string, (result: PredictionResult) => void>>(new Map())

  useEffect(() => {
    const worker = new Worker(
      new URL("../workers/classifier.worker.ts", import.meta.url),
      { type: "module" }
    )

    worker.onmessage = (e: MessageEvent) => {
      const data = e.data

      if (data.type === "status") {
        setStatus(data.status)
        if (data.message) setErrorMessage(data.message)
      }

      if (data.type === "download") {
        setDownloadProgress(data.progress)
      }

      if (data.type === "result") {
        const resolve = pendingRef.current.get(data.id)
        if (resolve) {
          resolve({ category: data.category, confidence: data.confidence })
          pendingRef.current.delete(data.id)
        }
      }

      if (data.type === "error") {
        const resolve = pendingRef.current.get(data.id)
        if (resolve) {
          resolve(null)
          pendingRef.current.delete(data.id)
        }
      }
    }

    workerRef.current = worker
    worker.postMessage({ type: "load" })

    return () => worker.terminate()
  }, [])

  const classify = useCallback(async (description: string) => {
    if (!description.trim()) { setPrediction(null); return }

    const feedbackHit = checkFeedback(description)
    if (feedbackHit) { setPrediction(feedbackHit); return }

    if (status !== "ready" || !workerRef.current) return

    const id = crypto.randomUUID()

    const result = await new Promise<PredictionResult>((resolve) => {
      pendingRef.current.set(id, resolve)
      workerRef.current!.postMessage({ type: "classify", id, text: description })
    })

    setPrediction(result)
  }, [status])

  const correct = useCallback((text: string, correctCategory: ExpenseCategory) => {
    const feedback = loadFeedback()
    const existing = feedback.findIndex(
      (f) => f.text.toLowerCase() === text.toLowerCase()
    )
    if (existing >= 0) {
      feedback[existing].category = correctCategory
    } else {
      feedback.push({ text: text.toLowerCase(), category: correctCategory })
    }
    saveFeedback(feedback)
    setPrediction({ category: correctCategory, confidence: 99 })
  }, [])

  const reset = useCallback(() => setPrediction(null), [])

  return {
    status,
    downloadProgress,
    errorMessage,
    prediction,
    isReady: status === "ready",
    classify,
    correct,
    reset,
    feedbackCount: loadFeedback().length,
  }
}