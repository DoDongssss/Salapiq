import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import { useFamilyStore } from "@/stores/useFamilyStore"
import { createSplits } from "@/services/splitService"
import type { SplitMember, SplitMode } from "@/types/SplitTypes"
import Avatar from "@/components/customs/Avatar"
import SpinnerBtn from "@/components/customs/SpinnerBtn"
import { X, Equal, Sliders, Percent } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  transactionId: string
  totalAmount:   number
  onClose:       () => void
  onSplit:       () => void
}

const MODES: { value: SplitMode; icon: typeof Equal; label: string }[] = [
  { value: "equal",      icon: Equal,   label: "Equal"   },
  { value: "custom",     icon: Sliders, label: "Custom"  },
  { value: "percentage", icon: Percent, label: "Percent" },
]

export default function SplitModal({ transactionId, totalAmount, onClose, onSplit }: Props) {
  const { user }  = useAuth()
  const { toast } = useToast()
  const family    = useFamilyStore((s) => s.family)

  const [mode,       setMode]       = useState<SplitMode>("equal")
  const [members,    setMembers]    = useState<SplitMember[]>([])
  const [note,       setNote]       = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Init members from family — exclude self
  useEffect(() => {
    if (!family || !user) return
    let cancelled = false

    const run = async () => {
      const others = family.members
        .filter((m) => m.user_id !== user.id)
        .map((m) => ({
          userId:   m.user_id,
          fullName: m.profile?.full_name ?? null,
          avatar:   m.profile?.avatar_url ?? null,
          amount:   0,
          included: true,
        }))
      if (cancelled) return
      setMembers(others)
    }

    run()
    return () => { cancelled = true }
  }, [family?.id, user?.id])

  // Recalculate amounts when mode or included members change
  const includedCount = members.filter((m) => m.included).length

  useEffect(() => {
    if (mode !== "equal" || !includedCount) return
    const share = Math.round((totalAmount / includedCount) * 100) / 100

    const run = async () => {
      setMembers((prev) =>
        prev.map((m) => ({ ...m, amount: m.included ? share : 0 }))
      )
    }

    run()
  }, [mode, totalAmount, includedCount])

  const toggleMember = (userId: string) => {
    setMembers((prev) =>
      prev.map((m) => m.userId === userId ? { ...m, included: !m.included } : m)
    )
  }

  const setAmount = (userId: string, value: number) => {
    setMembers((prev) =>
      prev.map((m) => m.userId === userId ? { ...m, amount: value } : m)
    )
  }

  const setPercent = (userId: string, pct: number) => {
    const amount = Math.round((totalAmount * pct / 100) * 100) / 100
    setMembers((prev) =>
      prev.map((m) => m.userId === userId ? { ...m, amount } : m)
    )
  }

  const included       = members.filter((m) => m.included)
  const totalAssigned  = included.reduce((s, m) => s + (m.amount || 0), 0)
  const remaining      = Math.round((totalAmount - totalAssigned) * 100) / 100
  const isValid        = included.length > 0 && included.every((m) => m.amount > 0) && remaining >= 0

  const handleSubmit = async () => {
    if (!user || !family || !isValid) return
    setSubmitting(true)

    const splits = included.map((m) => ({
      userId: m.userId,
      amount: m.amount,
    }))

    const error = await createSplits(
      transactionId,
      family.id,
      user.id,
      splits,
      note || undefined
    )

    setSubmitting(false)

    if (error) {
      toast({ type: "error", title: "Failed to split", description: error })
    } else {
      toast({ type: "success", title: `Split created with ${splits.length} member${splits.length > 1 ? "s" : ""}` })
      onClose()
      onSplit()
    }
  }

  if (!family) return null

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ animation: "modalIn 0.2s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        <style>{`
          @keyframes modalIn {
            from { opacity:0; transform:translateY(10px) scale(0.98); }
            to   { opacity:1; transform:translateY(0) scale(1); }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-[15px] font-semibold text-stone-900">Split expense</h2>
            <p className="mono text-[10px] text-stone-400 mt-0.5">
              ₱{totalAmount.toLocaleString("en-PH", { minimumFractionDigits: 2 })} total · {family.name}
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50">
            <X size={14} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">

          {/* Mode selector */}
          <div className="flex gap-1.5">
            {MODES.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setMode(value)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl mono text-[11px] border transition-all",
                  mode === value
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                    : "bg-stone-50 border-stone-200 text-stone-500 hover:border-stone-300"
                )}
              >
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>

          {/* Member rows */}
          <div className="flex flex-col gap-2">
            {members.map((m) => (
              <div
                key={m.userId}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all",
                  m.included ? "border-stone-200 bg-white" : "border-stone-100 bg-stone-50 opacity-50"
                )}
              >
                <button onClick={() => toggleMember(m.userId)} className="shrink-0">
                  <div className={cn(
                    "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all",
                    m.included ? "bg-emerald-500 border-emerald-500" : "border-stone-300"
                  )}>
                    {m.included && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                </button>

                <Avatar name={m.fullName ?? "?"} url={m.avatar} size="sm" />

                <p className="flex-1 text-[13px] font-medium text-stone-800 truncate">
                  {m.fullName ?? "Member"}
                </p>

                {m.included && (
                  <div className="shrink-0">
                    {mode === "equal" ? (
                      <p className="mono text-[13px] font-semibold text-stone-900">
                        ₱{m.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </p>
                    ) : mode === "custom" ? (
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 mono text-[11px] text-stone-400">₱</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={m.amount || ""}
                          onChange={(e) => setAmount(m.userId, parseFloat(e.target.value) || 0)}
                          className="h-8 w-28 text-[12px] pl-6 bg-stone-50 border-stone-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="relative">
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            max="100"
                            placeholder="0"
                            onChange={(e) => setPercent(m.userId, parseFloat(e.target.value) || 0)}
                            className="h-8 w-20 text-[12px] pr-6 bg-stone-50 border-stone-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 mono text-[11px] text-stone-400">%</span>
                        </div>
                        <p className="mono text-[11px] text-stone-500 w-20 text-right">
                          ₱{m.amount.toLocaleString("en-PH", { minimumFractionDigits: 0 })}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary bar */}
          <div className={cn(
            "flex items-center justify-between px-4 py-3 rounded-xl border",
            remaining < 0
              ? "bg-red-50 border-red-200"
              : remaining === 0
              ? "bg-emerald-50 border-emerald-200"
              : "bg-stone-50 border-stone-200"
          )}>
            <div>
              <p className="mono text-[10px] text-stone-400">Assigned</p>
              <p className="mono text-[13px] font-semibold text-stone-900">
                ₱{totalAssigned.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-right">
              <p className="mono text-[10px] text-stone-400">
                {remaining < 0 ? "Over by" : remaining === 0 ? "Balanced" : "Remaining"}
              </p>
              <p className={cn(
                "mono text-[13px] font-semibold",
                remaining < 0 ? "text-red-500" : remaining === 0 ? "text-emerald-600" : "text-stone-900"
              )}>
                {remaining !== 0 && "₱"}{remaining !== 0
                  ? Math.abs(remaining).toLocaleString("en-PH", { minimumFractionDigits: 2 })
                  : "✓"
                }
              </p>
            </div>
          </div>

          {/* Note */}
          <div className="flex flex-col gap-1.5">
            <label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">
              Note <span className="text-stone-300 normal-case">(optional)</span>
            </label>
            <Input
              placeholder="e.g. Dinner at Yabu, Weekend groceries"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-10 text-sm bg-stone-50 border-stone-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
            />
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="text-[12px] h-9 border-stone-200 text-stone-600">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isValid || submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] h-9 px-5 disabled:opacity-50"
            >
              {submitting ? <SpinnerBtn label="Splitting" /> : `Split with ${included.length} member${included.length !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}