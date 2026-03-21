import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useToast } from "@/hooks/useToast"
import { useAuth } from "@/hooks/useAuth"
import { useSavingsStore } from "@/stores/useSavingsStore"
import { useAccountStore } from "@/stores/useAccountStore"
import { useFamilyStore }  from "@/stores/useFamilyStore"
import {
  contributionSchema, type ContributionForm,
  type SavingsGoal, getGoalPercent,
} from "@/types/SavingsTypes"
import { addContribution } from "@/services/savingsService"
import SpinnerBtn from "@/components/customs/SpinnerBtn"
import { X, PiggyBank } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  goal:      SavingsGoal
  onClose:   () => void
  onSuccess?: () => void
}

export default function ContributeModal({ goal, onClose, onSuccess }: Props) {
  const { user }  = useAuth()
  const { toast } = useToast()

  const refresh               = useSavingsStore((s) => s.refresh)
  const refreshContributions  = useSavingsStore((s) => s.refreshContributions)
  const accounts        = useAccountStore((s) => s.accounts)
  const refreshAccounts = useAccountStore((s) => s.refresh)
  const family          = useFamilyStore((s) => s.family)

  const remaining = Math.max(goal.target_amount - goal.current_amount, 0)
  const pct       = getGoalPercent(goal)

  const form = useForm<ContributionForm>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      amount:            0,
      note:              "",
      source_account_id: accounts[0]?.id ?? "",
    },
  })

  const watchAmount    = form.watch("amount")
  const watchAccountId = form.watch("source_account_id")
  const selectedAccount = accounts.find((a) => a.id === watchAccountId)

  const onSubmit = async (data: ContributionForm) => {
    if (!user) return

    if (selectedAccount && data.amount > selectedAccount.balance) {
      form.setError("amount", { message: `Insufficient balance (₱${selectedAccount.balance.toLocaleString()})` })
      return
    }

    const { error } = await addContribution(goal.id, user.id, data)
    if (error) {
      toast({ type: "error", title: "Failed", description: error })
    } else {
      const newPct = Math.round(((goal.current_amount + data.amount) / goal.target_amount) * 100)
      if (newPct >= 100) {
        toast({ type: "success", title: "🎉 Goal achieved!", description: `You reached your ${goal.title} goal!` })
      } else {
        toast({ type: "success", title: "Contribution added", description: `₱${data.amount.toLocaleString()} deducted from ${selectedAccount?.name}` })
      }
      await Promise.all([
        refresh(user.id, family?.id),
        refreshAccounts(user.id),
        refreshContributions(goal.id),
      ])
      onSuccess?.()
      onClose()
    }
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
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
              <PiggyBank size={14} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-stone-900">Add funds</h2>
              <p className="mono text-[10px] text-stone-400">{goal.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50">
            <X size={14} />
          </button>
        </div>

        {/* Goal progress */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center justify-between mb-1.5">
            <p className="mono text-[10px] text-stone-400">
              ₱{goal.current_amount.toLocaleString("en-PH", { minimumFractionDigits: 0 })} saved
            </p>
            <p className="mono text-[10px] text-stone-400">{pct}%</p>
          </div>
          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden mb-1">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mono text-[10px] text-stone-400">
            ₱{remaining.toLocaleString("en-PH", { minimumFractionDigits: 0 })} to reach ₱{goal.target_amount.toLocaleString("en-PH", { minimumFractionDigits: 0 })}
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-4 flex flex-col gap-4">

          {/* Account selector */}
          <div className="flex flex-col gap-1.5">
            <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Deduct from account</Label>
            {accounts.length === 0 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="mono text-[11px] text-amber-700">No accounts found. Add an account first.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="relative">
                  <select
                    className={cn(
                      "w-full h-10 pl-3 pr-8 text-sm bg-stone-50 border border-stone-200 rounded-xl text-stone-800",
                      "focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer",
                      form.formState.errors.source_account_id && "border-red-300"
                    )}
                    {...form.register("source_account_id")}
                  >
                    <option value="">Select account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} · ₱{a.balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                </div>
                {form.formState.errors.source_account_id && (
                  <p className="mono text-[10px] text-red-400">— {form.formState.errors.source_account_id.message}</p>
                )}
                {/* Balance warning */}
                {selectedAccount && watchAmount > 0 && watchAmount > selectedAccount.balance && (
                  <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <p className="mono text-[10px] text-red-500">
                      Insufficient balance — ₱{selectedAccount.balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })} available
                    </p>
                  </div>
                )}
                {/* Balance preview */}
                {selectedAccount && watchAmount > 0 && watchAmount <= selectedAccount.balance && (
                  <p className="mono text-[10px] text-stone-400">
                    Balance after: ₱{(selectedAccount.balance - watchAmount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-1.5">
            <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Amount</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[16px] font-semibold text-stone-300">₱</span>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                className={cn(
                  "h-12 text-[18px] font-semibold bg-stone-50 border-stone-200 pl-8 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20",
                  form.formState.errors.amount && "border-red-300"
                )}
                {...form.register("amount", { valueAsNumber: true })}
              />
            </div>
            {form.formState.errors.amount && (
              <p className="mono text-[10px] text-red-400">— {form.formState.errors.amount.message}</p>
            )}

            {/* Quick amounts */}
            <div className="flex gap-2">
              {[500, 1000, 5000]
                .filter((v) => !selectedAccount || v <= selectedAccount.balance)
                .map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => form.setValue("amount", v)}
                    className="flex-1 h-8 mono text-[11px] bg-stone-50 border border-stone-200 rounded-lg hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                  >
                    +₱{v.toLocaleString()}
                  </button>
                ))
              }
              {remaining > 0 && selectedAccount && remaining <= selectedAccount.balance && (
                <button
                  type="button"
                  onClick={() => form.setValue("amount", remaining)}
                  className="flex-1 h-8 mono text-[11px] bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  Full
                </button>
              )}
            </div>
          </div>

          {/* Note */}
          <div className="flex flex-col gap-1.5">
            <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">
              Note <span className="text-stone-300">(optional)</span>
            </Label>
            <Input
              placeholder="e.g. Monthly savings"
              className="h-10 text-sm bg-stone-50 border-stone-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
              {...form.register("note")}
            />
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="text-[12px] h-9 border-stone-200 text-stone-600">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || accounts.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] h-9 px-5"
            >
              {form.formState.isSubmitting ? <SpinnerBtn label="Adding" /> : "Add funds"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}