import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import { useAIClassifyStore } from "@/stores/useAIClassifyStore"
import { useSettingStore } from "@/stores/useSettingStore"
import { applyCategory, skipTransaction } from "@/services/AIClassifyService"
import { TRANSACTION_CATEGORIES } from "@/types"
import type { ClassifyQueueItem } from "@/types"
import { AI_SOURCE_LABELS, AI_SOURCE_COLORS } from "@/config/ai-classify"
import {
  Sparkles, CheckCircle2, X, ChevronDown,
  TrendingDown, BarChart2,
  RefreshCw, AlertCircle, Tag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ActiveTab = "queue" | "history"

export default function AIClassify() {
  const { user }  = useAuth()
  const { toast } = useToast()

  const queue    = useAIClassifyStore((s) => s.queue)
  const history  = useAIClassifyStore((s) => s.history)
  const stats    = useAIClassifyStore((s) => s.stats)
  const loading  = useAIClassifyStore((s) => s.loading)
  const fetch    = useAIClassifyStore((s) => s.fetch)
  const refresh  = useAIClassifyStore((s) => s.refresh)
  const remove   = useAIClassifyStore((s) => s.removeFromQueue)

  const aiOptIn  = useSettingStore((s) => s.aiOptIn)

  const [activeTab,    setActiveTab]    = useState<ActiveTab>("queue")
  const [applying,     setApplying]     = useState<string | null>(null)
  const [skipping,     setSkipping]     = useState<string | null>(null)
  const [overrideOpen, setOverrideOpen] = useState<string | null>(null)

  useEffect(() => {
    if (user) fetch(user.id)
  }, [user, fetch])

  const handleAccept = async (item: ClassifyQueueItem) => {
    if (!user || !item.suggestedCategory) return
    setApplying(item.transaction.id)

    const error = await applyCategory(
      item.transaction.id,
      user.id,
      item.transaction.note ?? item.transaction.category ?? "",
      item.suggestedCategory,
      item.suggestedCategory,
    )

    setApplying(null)

    if (error) {
      toast({ type: "error", title: "Failed", description: error })
    } else {
      toast({ type: "success", title: `Categorized as ${item.suggestedCategory}` })
      remove(item.transaction.id)
      refresh(user.id)
    }
  }

  const handleOverride = async (item: ClassifyQueueItem, category: string) => {
    if (!user) return
    setApplying(item.transaction.id)
    setOverrideOpen(null)

    const error = await applyCategory(
      item.transaction.id,
      user.id,
      item.transaction.note ?? item.transaction.category ?? "",
      category,
      item.suggestedCategory,
    )

    setApplying(null)

    if (error) {
      toast({ type: "error", title: "Failed", description: error })
    } else {
      toast({ type: "success", title: `Categorized as ${category}` })
      remove(item.transaction.id)
      refresh(user.id)
    }
  }

  const handleSkip = async (item: ClassifyQueueItem) => {
    if (!user) return
    setSkipping(item.transaction.id)
    await skipTransaction(item.transaction.id)
    setSkipping(null)
    remove(item.transaction.id)
    toast({ type: "info", title: "Skipped" })
  }

  const handleClassifyAll = async () => {
    if (!user) return
    const withSuggestions = queue.filter((i) => i.suggestedCategory)
    if (!withSuggestions.length) {
      toast({ type: "info", title: "No suggestions to apply" })
      return
    }

    for (const item of withSuggestions) {
      await applyCategory(
        item.transaction.id,
        user.id,
        item.transaction.note ?? "",
        item.suggestedCategory!,
        item.suggestedCategory,
      )
      remove(item.transaction.id)
    }

    toast({ type: "success", title: `Applied ${withSuggestions.length} categories` })
    refresh(user.id)
  }

  const withSuggestions = queue.filter((i) => i.suggestedCategory).length
  const withoutSuggestions = queue.filter((i) => !i.suggestedCategory).length

  return (
    <div className="page-reveal">

      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">AI Classify</h1>
            <span className="mono text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles size={9} /> Privacy-first
            </span>
          </div>
          <p className="mono text-[11px] text-stone-400">
            Auto-categorize your uncategorized transactions
          </p>
        </div>
        {queue.length > 0 && withSuggestions > 0 && (
          <Button
            onClick={handleClassifyAll}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] h-9 px-4"
          >
            <Sparkles size={13} /> Apply all ({withSuggestions})
          </Button>
        )}
      </div>

      {!aiOptIn && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-5">
          <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-medium text-amber-800">AI classification is disabled</p>
            <p className="mono text-[11px] text-amber-600 mt-0.5">
              Enable AI insights in Settings → AI & Privacy to get smarter suggestions. Keyword matching still works.
            </p>
          </div>
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-4 gap-3 mb-5">
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
            <p className="mono text-[9px] text-stone-400 mb-1 uppercase tracking-[0.1em]">Unclassified</p>
            <p className="text-[22px] font-semibold text-stone-900">{queue.length}</p>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
            <p className="mono text-[9px] text-stone-400 mb-1 uppercase tracking-[0.1em]">With suggestion</p>
            <p className="text-[22px] font-semibold text-emerald-600">{withSuggestions}</p>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
            <p className="mono text-[9px] text-stone-400 mb-1 uppercase tracking-[0.1em]">Total classified</p>
            <p className="text-[22px] font-semibold text-stone-900">{stats?.total_classified ?? 0}</p>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
            <p className="mono text-[9px] text-stone-400 mb-1 uppercase tracking-[0.1em]">Accuracy</p>
            <p className="text-[22px] font-semibold text-stone-900">
              {stats?.accuracy_percent ? `${stats.accuracy_percent}%` : "—"}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 mb-4">
        {(["queue", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "mono text-[11px] px-3 py-1.5 rounded-lg transition-colors capitalize",
              activeTab === tab
                ? "bg-emerald-50 text-emerald-700"
                : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"
            )}
          >
            {tab === "queue"
              ? `Queue ${queue.length > 0 ? `(${queue.length})` : ""}`
              : `History ${history.length > 0 ? `(${history.length})` : ""}`
            }
          </button>
        ))}
        <button
          onClick={() => user && refresh(user.id)}
          className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={13} />
        </button>
      </div>

      {activeTab === "queue" && (
        <>
          {loading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-white rounded-2xl border border-stone-200 animate-pulse" />
              ))}
            </div>
          ) : queue.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-14 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={24} className="text-emerald-500" />
              </div>
              <p className="text-[14px] font-semibold text-stone-700">All caught up!</p>
              <p className="mono text-[11px] text-stone-400 mt-1.5">
                No uncategorized transactions found
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-0 bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
              {withoutSuggestions > 0 && (
                <div className="px-5 py-2.5 bg-stone-50 border-b border-stone-100">
                  <p className="mono text-[10px] text-stone-400">
                    {withoutSuggestions} transaction{withoutSuggestions !== 1 ? "s" : ""} without a suggestion — select a category manually
                  </p>
                </div>
              )}
              {queue.map((item) => (
                <QueueRow
                  key={item.transaction.id}
                  item={item}
                  applying={applying === item.transaction.id}
                  skipping={skipping === item.transaction.id}
                  overrideOpen={overrideOpen === item.transaction.id}
                  onAccept={() => handleAccept(item)}
                  onOverride={(cat) => handleOverride(item, cat)}
                  onSkip={() => handleSkip(item)}
                  onToggleOverride={() => setOverrideOpen(
                    overrideOpen === item.transaction.id ? null : item.transaction.id
                  )}
                />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "history" && (
        <>
          {history.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-14 text-center">
              <BarChart2 size={28} className="text-stone-200 mx-auto mb-3" />
              <p className="text-[13px] font-medium text-stone-600">No classification history yet</p>
              <p className="mono text-[11px] text-stone-400 mt-1">
                Start classifying transactions to build your history
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
              {history.map((h, i) => (
                <div
                  key={h.id}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3.5",
                    i < history.length - 1 && "border-b border-stone-50"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    h.was_correct ? "bg-emerald-50" : "bg-amber-50"
                  )}>
                    {h.was_correct
                      ? <CheckCircle2 size={13} className="text-emerald-500" />
                      : <Tag size={13} className="text-amber-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-stone-800 truncate capitalize">
                      {h.note || "—"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {h.suggested_category && h.suggested_category !== h.accepted_category && (
                        <>
                          <p className="mono text-[10px] text-stone-400 line-through">{h.suggested_category}</p>
                          <span className="text-stone-300">→</span>
                        </>
                      )}
                      <p className="mono text-[10px] text-stone-600">{h.accepted_category}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={cn(
                      "mono text-[9px] px-1.5 py-0.5 rounded-full border",
                      h.was_correct
                        ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                        : "text-amber-700 bg-amber-50 border-amber-200"
                    )}>
                      {h.was_correct ? "Correct" : "Corrected"}
                    </p>
                    <p className="mono text-[9px] text-stone-300 mt-1">
                      {new Date(h.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function QueueRow({
  item, applying, skipping, overrideOpen,
  onAccept, onOverride, onSkip, onToggleOverride,
}: {
  item:             ClassifyQueueItem
  applying:         boolean
  skipping:         boolean
  overrideOpen:     boolean
  onAccept:         () => void
  onOverride:       (cat: string) => void
  onSkip:           () => void
  onToggleOverride: () => void
}) {
  const { transaction: t, suggestedCategory, confidence, source } = item
  const isBusy = applying || skipping

  return (
    <div className="border-b border-stone-50 last:border-0">
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
          <TrendingDown size={15} className="text-red-500" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-stone-800 truncate">
            {t.note || "Unnamed transaction"}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="mono text-[10px] text-stone-400">{t.account?.name}</p>
            <span className="text-stone-200">·</span>
            <p className="mono text-[10px] text-stone-400">
              {new Date(t.date + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
            </p>
            <span className="text-stone-200">·</span>
            <p className="mono text-[10px] text-stone-800 font-medium">
              ₱{t.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {suggestedCategory ? (
            <>
              <div className="flex flex-col items-end gap-1">
                <span className={cn("mono text-[9px] px-1.5 py-0.5 rounded-full border", AI_SOURCE_COLORS[source])}>
                  {AI_SOURCE_LABELS[source]}
                </span>
                <span className="mono text-[10px] font-medium text-stone-700">{suggestedCategory}</span>
                {confidence > 0 && (
                  <span className="mono text-[9px] text-stone-400">{Math.round(confidence * 100)}% confidence</span>
                )}
              </div>

              <button
                onClick={onAccept}
                disabled={isBusy}
                className="flex items-center gap-1 h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white mono text-[11px] rounded-lg transition-colors disabled:opacity-50"
              >
                {applying
                  ? <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  : <CheckCircle2 size={12} />
                }
                Accept
              </button>
            </>
          ) : (
            <span className={cn("mono text-[9px] px-1.5 py-0.5 rounded-full border", AI_SOURCE_COLORS["none"])}>
              No suggestion
            </span>
          )}

          <button
            onClick={onToggleOverride}
            disabled={isBusy}
            className="flex items-center gap-0.5 h-8 px-2 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-600 mono text-[11px] rounded-lg transition-colors disabled:opacity-50"
            title="Choose category"
          >
            <ChevronDown size={12} className={cn("transition-transform", overrideOpen && "rotate-180")} />
          </button>

          <button
            onClick={onSkip}
            disabled={isBusy}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-300 hover:text-stone-500 hover:bg-stone-50 transition-colors disabled:opacity-50"
            title="Skip"
          >
            {skipping
              ? <span className="w-3 h-3 rounded-full border-2 border-stone-200 border-t-stone-500 animate-spin" />
              : <X size={13} />
            }
          </button>
        </div>
      </div>

      {overrideOpen && (
        <div className="px-5 pb-4">
          <p className="mono text-[10px] text-stone-400 mb-2">Select a category:</p>
          <div className="flex flex-wrap gap-1.5">
            {TRANSACTION_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => onOverride(cat)}
                className={cn(
                  "mono text-[10px] px-2.5 py-1.5 rounded-lg border transition-colors",
                  cat === suggestedCategory
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                    : "bg-stone-50 border-stone-200 text-stone-600 hover:border-emerald-300 hover:text-emerald-700"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}