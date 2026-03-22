import { create } from "zustand"
import {
  getUnclassified, classifyNote,
  getClassificationHistory, getAccuracyStats,
} from "@/services/AIClassifyService"
import type {
  ClassifyQueueItem, AIClassification, AIAccuracyStats, TransactionWithAccount,
} from "@/types"

interface AIState {
  queue:       ClassifyQueueItem[]
  history:     AIClassification[]
  stats:       AIAccuracyStats | null
  loading:     boolean
  classifying: boolean

  fetch:          (userId: string) => Promise<void>
  refresh:        (userId: string) => Promise<void>
  removeFromQueue:(transactionId: string) => void
  reset:          () => void
}

async function buildQueue(
  userId: string,
  transactions: TransactionWithAccount[]
): Promise<ClassifyQueueItem[]> {
  const items: ClassifyQueueItem[] = []

  for (const t of transactions) {
    const note = t.note ?? t.category ?? ""
    if (!note) {
      items.push({ transaction: t, suggestedCategory: null, confidence: 0, source: "none" })
      continue
    }

    const result = await classifyNote(userId, note)
    items.push({
      transaction:       t,
      suggestedCategory: result.category,
      confidence:        result.confidence,
      source:            result.source,
    })
  }

  return items
}

export const useAIClassifyStore = create<AIState>((set) => ({
  queue:       [],
  history:     [],
  stats:       null,
  loading:     false,
  classifying: false,

  fetch: async (userId) => {
    set({ loading: true })

    const [transactions, history, stats] = await Promise.all([
      getUnclassified(userId),
      getClassificationHistory(userId),
      getAccuracyStats(userId),
    ])

    const queue = await buildQueue(userId, transactions)

    set({ queue, history, stats, loading: false })
  },

  refresh: async (userId) => {
    const [transactions, history, stats] = await Promise.all([
      getUnclassified(userId),
      getClassificationHistory(userId),
      getAccuracyStats(userId),
    ])

    const queue = await buildQueue(userId, transactions)
    set({ queue, history, stats })
  },

  removeFromQueue: (transactionId) => {
    set((s) => ({
      queue: s.queue.filter((item) => item.transaction.id !== transactionId),
    }))
  },

  reset: () => set({ queue: [], history: [], stats: null, loading: false, classifying: false }),
}))