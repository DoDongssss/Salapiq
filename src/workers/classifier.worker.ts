import { pipeline, env } from "@huggingface/transformers"

env.allowLocalModels = false
env.useBrowserCache = true

const CATEGORIES = [
  "food and dining",
  "transportation",
  "shopping",
  "utilities and bills",
  "healthcare and medicine",
  "entertainment and leisure",
  "education",
  "savings and investment",
  "other",
]

const CATEGORY_LABELS = [
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let classifier: any = null

async function loadModel() {
  self.postMessage({ type: "status", status: "loading" })
  try {
    classifier = await pipeline(
      "zero-shot-classification",
      "Xenova/distilbert-base-uncased-mnli",
      {
        progress_callback: (progress: { status: string; progress?: number }) => {
          if (progress.status === "progress" && progress.progress != null) {
            self.postMessage({
              type: "download",
              progress: Math.round(progress.progress),
            })
          }
        },
      }
    )
    self.postMessage({ type: "status", status: "ready" })
  } catch (err) {
    self.postMessage({
      type: "status",
      status: "error",
      message: err instanceof Error ? err.message : "Failed to load model",
    })
  }
}

async function classify(id: string, text: string) {
  if (!classifier) return

  try {
    const result = await classifier(text, CATEGORIES) as {
      labels: string[]
      scores: number[]
    }

    const topIndex = CATEGORIES.indexOf(result.labels[0])
    const confidence = Math.round(result.scores[0] * 100)

    self.postMessage({
      type: "result",
      id,
      category: CATEGORY_LABELS[topIndex] ?? "Other",
      confidence,
    })
  } catch (err) {
    self.postMessage({
      type: "error",
      id,
      message: err instanceof Error ? err.message : "Classification failed",
    })
  }
}

self.onmessage = async (e: MessageEvent) => {
  const { type, id, text } = e.data
  if (type === "load") await loadModel()
  if (type === "classify") await classify(id, text)
}