import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import { useAccountStore } from "@/stores/useAccountStore"
import {
  transactionSchema, type TransactionForm,
  type Account, TRANSACTION_CATEGORIES,
} from "@/types/AccountTypes"
import { updateTransaction } from "@/services/AccountService"
import type { TransactionWithAccount } from "@/services/AccountService"
import SettingsSelect from "@/components/customs/SettingsSelect"
import SpinnerBtn from "@/components/customs/SpinnerBtn"
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  transaction: TransactionWithAccount
  accounts:    Account[]
  onClose:     () => void
  onUpdated:   () => void
}

export default function EditTransactionModal({ transaction, accounts, onClose, onUpdated }: Props) {
  const { user }  = useAuth()
  const { toast } = useToast()
  const refreshAccounts = useAccountStore((s) => s.refresh)

  const form = useForm<TransactionForm>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      account_id:    transaction.account_id,
      amount:        transaction.amount,
      type:          transaction.type,
      category:      transaction.category  ?? "",
      note:          transaction.note      ?? "",
      date:          transaction.date,
      to_account_id: transaction.to_account_id ?? "",
    },
  })

  const watchType      = form.watch("type")
  const watchAccountId = form.watch("account_id")

  const onSubmit = async (data: TransactionForm) => {
    if (!user) return
    const error = await updateTransaction(transaction.id, data)
    if (error) {
      toast({ type: "error", title: "Update failed", description: error })
    } else {
      toast({ type: "success", title: "Transaction updated" })
      await refreshAccounts(user.id)
      onUpdated()
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-100">
          <h2 className="text-[15px] font-semibold text-stone-900">Edit transaction</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 flex flex-col gap-4">

          {/* Type toggle */}
          <div className="flex gap-1 p-1 bg-stone-100 rounded-xl">
            {(["expense", "income", "transfer"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => form.setValue("type", t)}
                className={cn(
                  "flex-1 py-1.5 rounded-lg text-[12px] font-medium transition-all capitalize",
                  watchType === t ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-1.5">
            <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 mono text-[12px] text-stone-400">₱</span>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                className={cn("h-10 text-sm bg-stone-50 border-stone-200 pl-7 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20", form.formState.errors.amount && "border-red-300")}
                {...form.register("amount", { valueAsNumber: true })}
              />
            </div>
            {form.formState.errors.amount && <p className="mono text-[10px] text-red-400">— {form.formState.errors.amount.message}</p>}
          </div>

          {/* Account */}
          <SettingsSelect
            label={watchType === "transfer" ? "From account" : "Account"}
            error={form.formState.errors.account_id?.message}
            {...form.register("account_id")}
          >
            <option value="">Select account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name} · ₱{a.balance.toLocaleString()}</option>
            ))}
          </SettingsSelect>

          {/* Transfer destination */}
          {watchType === "transfer" && (
            <SettingsSelect label="To account" {...form.register("to_account_id")}>
              <option value="">Select destination</option>
              {accounts
                .filter((a) => a.id !== watchAccountId)
                .map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))
              }
            </SettingsSelect>
          )}

          {/* Category */}
          {watchType !== "transfer" && (
            <SettingsSelect label="Category" {...form.register("category")}>
              <option value="">No category</option>
              {TRANSACTION_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </SettingsSelect>
          )}

          {/* Note + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Note</Label>
              <Input
                placeholder="Optional"
                className="h-10 text-sm bg-stone-50 border-stone-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                {...form.register("note")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Date</Label>
              <Input
                type="date"
                className="h-10 text-sm bg-stone-50 border-stone-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                {...form.register("date")}
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="text-[12px] h-9 border-stone-200 text-stone-600">Cancel</Button>
            <Button type="submit" disabled={form.formState.isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] h-9 px-5">
              {form.formState.isSubmitting ? <SpinnerBtn label="Saving" /> : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}