import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import { unsettleSplit, getSplitSummary } from "@/services/SplitService"
import type { ExpenseSplit, SplitSummary } from "@/types"
import SettleSplitModal from "@/components/modals/SettleSplitModal"
import type { FamilyWithMembers } from "@/services/FamilyService"
import Avatar from "@/components/customs/Avatar"
import { CheckCircle2, Clock, TrendingUp, TrendingDown, ArrowLeftRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = { family: FamilyWithMembers }

type ActiveTab = "pending" | "settled"

export default function FamilySplits({ family }: Props) {
  const { user }  = useAuth()
  const { toast } = useToast()

  const [summary,   setSummary]   = useState<SplitSummary | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState<ActiveTab>("pending")
  const [settling,      setSettling]      = useState<string | null>(null)
  const [settlingModal, setSettlingModal]  = useState<ExpenseSplit | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false

    const run = async () => {
      setLoading(true)
      const data = await getSplitSummary(family.id, user.id)
      if (cancelled) return
      setSummary(data)
      setLoading(false)
    }

    run()
    return () => { cancelled = true }
  }, [family.id, user])

  const reload = async () => {
    if (!user) return
    const data = await getSplitSummary(family.id, user.id)
    setSummary(data)
  }

  const handleSettle = async (split: ExpenseSplit) => {
    if (!split.is_settled) {
      setSettlingModal(split)
      return
    }
    setSettling(split.id)
    const error = await unsettleSplit(split.id)
    setSettling(null)
    if (error) {
      toast({ type: "error", title: "Failed", description: error })
    } else {
      toast({ type: "info", title: "Marked as unsettled" })
      reload()
    }
  }

  const displayed = activeTab === "pending"
    ? summary?.pendingSplits ?? []
    : summary?.settledSplits ?? []

  return (
    <div className="flex flex-col gap-5">

      {!loading && summary && (
        <div className="grid grid-cols-3 gap-3">
          <div className={cn(
            "rounded-2xl border p-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)]",
            summary.netBalance >= 0 ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
          )}>
            <p className="mono text-[9px] text-stone-400 mb-1 uppercase tracking-[0.1em]">Net balance</p>
            <p className={cn("text-[20px] font-semibold", summary.netBalance >= 0 ? "text-emerald-700" : "text-red-600")}>
              {summary.netBalance >= 0 ? "+" : ""}₱{Math.abs(summary.netBalance).toLocaleString("en-PH", { minimumFractionDigits: 0 })}
            </p>
            <p className="mono text-[9px] text-stone-400 mt-0.5">
              {summary.netBalance >= 0 ? "You are owed" : "You owe"}
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
            <p className="mono text-[9px] text-stone-400 mb-1 uppercase tracking-[0.1em]">Owed to you</p>
            <p className="text-[20px] font-semibold text-emerald-600">
              ₱{summary.totalOwedToMe.toLocaleString("en-PH", { minimumFractionDigits: 0 })}
            </p>
            <p className="mono text-[9px] text-stone-400 mt-0.5">{summary.pendingSplits.filter(s => s.created_by === user?.id && s.owed_by !== user?.id).length} pending</p>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
            <p className="mono text-[9px] text-stone-400 mb-1 uppercase tracking-[0.1em]">You owe</p>
            <p className="text-[20px] font-semibold text-red-500">
              ₱{summary.totalIOwe.toLocaleString("en-PH", { minimumFractionDigits: 0 })}
            </p>
            <p className="mono text-[9px] text-stone-400 mt-0.5">{summary.pendingSplits.filter(s => s.owed_by === user?.id && s.created_by !== user?.id).length} pending</p>
          </div>
        </div>
      )}

      <div className="flex gap-1.5">
        {(["pending", "settled"] as const).map((tab) => (
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
            {tab}
            {tab === "pending" && summary && summary.pendingSplits.length > 0 && (
              <span className="ml-1.5 mono text-[9px] bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full">
                {summary.pendingSplits.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-stone-200 animate-pulse" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-3">
            {activeTab === "pending"
              ? <Clock size={20} className="text-stone-300" />
              : <CheckCircle2 size={20} className="text-stone-300" />
            }
          </div>
          <p className="text-[13px] font-medium text-stone-600">
            {activeTab === "pending" ? "No pending splits" : "No settled splits yet"}
          </p>
          <p className="mono text-[11px] text-stone-400 mt-1">
            {activeTab === "pending"
              ? "Split an expense from any transaction to track who owes what"
              : "Settled splits will appear here"
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
          {displayed.map((split, i) => {
            const iOwe      = split.owed_by === user?.id && split.created_by !== user?.id
            const owesMe    = split.created_by === user?.id && split.owed_by !== user?.id
            const isSettling = settling === split.id

            return (
              <div
                key={split.id}
                className={cn(
                  "flex items-center gap-3 px-5 py-4 transition-colors",
                  i < displayed.length - 1 && "border-b border-stone-50",
                  split.is_settled && "opacity-60"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                  iOwe   ? "bg-red-50"     :
                  owesMe ? "bg-emerald-50" : "bg-stone-50"
                )}>
                  {iOwe
                    ? <TrendingDown size={15} className="text-red-500" />
                    : owesMe
                    ? <TrendingUp size={15} className="text-emerald-600" />
                    : <ArrowLeftRight size={15} className="text-stone-400" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-stone-800 truncate">
                    {split.transaction?.note ?? split.note ?? "Shared expense"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Avatar
                      name={split.owed_by_profile?.full_name ?? "?"}
                      url={split.owed_by_profile?.avatar_url}
                      size="sm"
                    />
                    <p className="mono text-[10px] text-stone-400">
                      {iOwe
                        ? `You owe ${family.members.find(m => m.user_id === split.created_by)?.profile?.full_name ?? "someone"}`
                        : owesMe
                        ? `${split.owed_by_profile?.full_name ?? "Member"} owes you`
                        : split.owed_by_profile?.full_name
                      }
                    </p>
                    {split.transaction?.date && (
                      <>
                        <span className="text-stone-200">·</span>
                        <p className="mono text-[10px] text-stone-300">
                          {new Date(split.transaction.date + "T00:00:00").toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <p className={cn(
                  "mono text-[14px] font-semibold shrink-0",
                  iOwe ? "text-red-500" : owesMe ? "text-emerald-600" : "text-stone-700"
                )}>
                  {iOwe ? "−" : owesMe ? "+" : ""}₱{split.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </p>

                <Button
                  onClick={() => handleSettle(split)}
                  disabled={isSettling}
                  variant="outline"
                  className={cn(
                    "shrink-0 h-8 px-3 mono text-[10px] transition-colors",
                    split.is_settled
                      ? "border-stone-200 text-stone-400 hover:border-amber-300 hover:text-amber-600"
                      : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                  )}
                >
                  {isSettling ? "..." : split.is_settled ? "Unsettle" : "Settle"}
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {settlingModal && (
        <SettleSplitModal
          split={settlingModal}
          onClose={() => setSettlingModal(null)}
          onSettled={() => { setSettlingModal(null); reload() }}
        />
      )}
    </div>
  )
}