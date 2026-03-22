import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import { useAccountStore } from "@/stores/useAccountStore"
import { settleSplit } from "@/services/SplitService"
import { createTransaction } from "@/services/AccountService"
import type { ExpenseSplit } from "@/types/SplitTypes"
import SpinnerBtn from "@/components/customs/SpinnerBtn"
import { X, SplitSquareHorizontal, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  split:     ExpenseSplit
  onClose:   () => void
  onSettled: () => void
}

export default function SettleSplitModal({ split, onClose, onSettled }: Props) {
  const { user }        = useAuth()
  const { toast }       = useToast()
  const accounts        = useAccountStore((s) => s.accounts)
  const refreshAccounts = useAccountStore((s) => s.refresh)

  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id ?? "")
  const [submitting,        setSubmitting]         = useState(false)

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId)
  const hasEnough       = selectedAccount ? selectedAccount.balance >= split.amount : false
  const label           = split.transaction?.note ?? split.note ?? "Shared expense"

  const handleSettle = async () => {
    if (!user || !selectedAccountId) return
    setSubmitting(true)

    const { error: txnError } = await createTransaction(user.id, {
      account_id:    selectedAccountId,
      type:          "expense",
      amount:        split.amount,
      category:      "Transfer",
      note:          `Split settlement: ${label}`,
      date:          new Date().toISOString().split("T")[0],
      to_account_id: "",
    })

    if (txnError) {
      toast({ type: "error", title: "Failed to create transaction", description: txnError })
      setSubmitting(false)
      return
    }

    const settleError = await settleSplit(split.id)

    if (settleError) {
      toast({ type: "error", title: "Failed to settle", description: settleError })
      setSubmitting(false)
      return
    }

    await refreshAccounts(user.id)

    toast({
      type:  "success",
      title: "Split settled",
      description: `₱${split.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })} deducted from ${selectedAccount?.name}`,
    })

    setSubmitting(false)
    onSettled()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        style={{ animation: "modalIn 0.2s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        <style>{`
          @keyframes modalIn {
            from { opacity:0; transform:translateY(10px) scale(0.98); }
            to   { opacity:1; transform:translateY(0) scale(1); }
          }
        `}</style>

        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center">
              <SplitSquareHorizontal size={14} className="text-sky-600" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-stone-900">Settle split</h2>
              <p className="mono text-[10px] text-stone-400 mt-0.5">{label}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50">
            <X size={14} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">

          <div className="bg-stone-50 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="mono text-[9px] text-stone-400 uppercase tracking-[0.1em] mb-1">Amount to settle</p>
              <p className="text-[22px] font-semibold text-stone-900 tracking-tight">
                ₱{split.amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-right">
              <p className="mono text-[9px] text-stone-400 uppercase tracking-[0.1em] mb-1">For</p>
              <p className="mono text-[11px] text-stone-600 max-w-[120px] text-right leading-tight">{label}</p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400 flex items-center gap-1">
              <Wallet size={10} /> Pay from account
            </label>
            {accounts.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="mono text-[11px] text-amber-700">No accounts available.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {accounts.map((a) => {
                  const isSelected    = selectedAccountId === a.id
                  const isInsufficient = a.balance < split.amount
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setSelectedAccountId(a.id)}
                      disabled={isInsufficient}
                      className={cn(
                        "flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all",
                        isSelected
                          ? "border-sky-400 bg-sky-50"
                          : isInsufficient
                          ? "border-stone-100 bg-stone-50 opacity-40 cursor-not-allowed"
                          : "border-stone-200 hover:border-stone-300"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                        <div>
                          <p className="text-[12px] font-medium text-stone-800">{a.name}</p>
                          <p className="mono text-[10px] text-stone-400">
                            ₱{a.balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })} available
                          </p>
                        </div>
                      </div>
                      {isInsufficient && (
                        <span className="mono text-[9px] text-red-400">Insufficient</span>
                      )}
                      {isSelected && !isInsufficient && (
                        <div className="w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center">
                          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                            <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {selectedAccount && hasEnough && (
            <p className="mono text-[10px] text-stone-400 text-center">
              Balance after settlement: ₱{(selectedAccount.balance - split.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </p>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="text-[12px] h-9 border-stone-200 text-stone-600">
              Cancel
            </Button>
            <Button
              onClick={handleSettle}
              disabled={!selectedAccountId || !hasEnough || submitting || accounts.length === 0}
              className="bg-sky-500 hover:bg-sky-600 text-white text-[12px] h-9 px-5 disabled:opacity-50"
            >
              {submitting ? <SpinnerBtn label="Settling" /> : "Settle & pay"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}