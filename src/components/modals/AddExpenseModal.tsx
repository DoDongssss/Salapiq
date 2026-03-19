import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import { transactionSchema, type TransactionForm, TRANSACTION_CATEGORIES } from "@/types/Accounts"
import { getAccounts, createTransaction } from "@/services/AccountService"
import type { Account } from "@/types/Accounts"
import SettingsSelect from "@/components/customs/SettingsSelect"
import SpinnerBtn from "@/components/customs/SpinnerBtn"
import {
  X, TrendingDown, TrendingUp, ArrowLeftRight,
  DollarSign, Calendar, FileText, Tag, Wallet,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  open:    boolean
  onClose: () => void
  onAdded?: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddExpenseModal({ open, onClose, onAdded }: Props) {
  const { user }  = useAuth()
  const { toast } = useToast()

  const [accounts,  setAccounts]  = useState<Account[]>([])
  const [loadingAcc, setLoadingAcc] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  const form = useForm<TransactionForm>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      account_id:    "",
      amount:        undefined,
      type:          "expense",
      category:      "",
      note:          "",
      date:          new Date().toISOString().split("T")[0],
      to_account_id: "",
    },
  })

  const watchType      = form.watch("type")
  const watchAccountId = form.watch("account_id")

  // Load accounts when modal opens
  useEffect(() => {
    if (!open || !user) return
    setLoadingAcc(true)
    getAccounts(user.id).then((accs) => {
      setAccounts(accs)
      if (accs.length > 0) form.setValue("account_id", accs[0].id)
      setLoadingAcc(false)
    })
  }, [open, user])

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      form.reset({
        account_id:    "",
        amount:        undefined,
        type:          "expense",
        category:      "",
        note:          "",
        date:          new Date().toISOString().split("T")[0],
        to_account_id: "",
      })
    }
  }, [open])

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (open) window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onClose])

  const onSubmit = async (data: TransactionForm) => {
    if (!user) return
    const { error } = await createTransaction(user.id, data)
    if (error) {
      toast({ type: "error", title: "Failed", description: error })
      return
    }
    toast({ type: "success", title: "Transaction added" })
    onClose()
    onAdded?.()
  }

  if (!open) return null

  const TYPE_TABS = [
    { value: "expense",  label: "Expense",  icon: TrendingDown  },
    { value: "income",   label: "Income",   icon: TrendingUp    },
    { value: "transfer", label: "Transfer", icon: ArrowLeftRight },
  ] as const

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ animation: "modalIn 0.2s cubic-bezier(0.22,1,0.36,1) both" }}
      >
        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: translateY(12px) scale(0.98); }
            to   { opacity: 1; transform: translateY(0)    scale(1);    }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-[15px] font-semibold text-stone-900 tracking-tight">Add transaction</h2>
            <p className="mono text-[10px] text-stone-400 mt-0.5">
              {new Date().toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 flex flex-col gap-4">

          {/* Type toggle */}
          <div className="flex gap-1 p-1 bg-stone-100 rounded-xl">
            {TYPE_TABS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => form.setValue("type", value)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-medium transition-all",
                  watchType === value
                    ? value === "expense"
                      ? "bg-white text-red-500 shadow-sm"
                      : value === "income"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "bg-white text-sky-600 shadow-sm"
                    : "text-stone-400 hover:text-stone-600"
                )}
              >
                <Icon size={12} />{label}
              </button>
            ))}
          </div>

          {/* Amount — big and prominent */}
          <div className="flex flex-col gap-1.5">
            <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400 flex items-center gap-1">
              <DollarSign size={10} /> Amount
            </Label>
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
          </div>

          {/* From account */}
          {loadingAcc ? (
            <div className="h-10 bg-stone-100 rounded-lg animate-pulse" />
          ) : (
            <SettingsSelect
              label={watchType === "transfer" ? "From account" : "Account"}
              icon={Wallet}
              error={form.formState.errors.account_id?.message}
              {...form.register("account_id")}
            >
              <option value="">Select account</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · ₱{a.balance.toLocaleString()}
                </option>
              ))}
            </SettingsSelect>
          )}

          {/* Transfer destination */}
          {watchType === "transfer" && (
            <SettingsSelect
              label="To account"
              icon={ArrowLeftRight}
              error={form.formState.errors.to_account_id?.message}
              {...form.register("to_account_id")}
            >
              <option value="">Select destination</option>
              {accounts
                .filter((a) => a.id !== watchAccountId)
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} · ₱{a.balance.toLocaleString()}
                  </option>
                ))}
            </SettingsSelect>
          )}

          {/* Category */}
          {watchType !== "transfer" && (
            <SettingsSelect
              label="Category"
              icon={Tag}
              {...form.register("category")}
            >
              <option value="">No category</option>
              {TRANSACTION_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </SettingsSelect>
          )}

          {/* Note + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400 flex items-center gap-1">
                <FileText size={10} /> Note
              </Label>
              <Input
                placeholder="Optional"
                className="h-10 text-sm bg-stone-50 border-stone-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                {...form.register("note")}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400 flex items-center gap-1">
                <Calendar size={10} /> Date
              </Label>
              <Input
                type="date"
                className="h-10 text-sm bg-stone-50 border-stone-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                {...form.register("date")}
              />
            </div>
          </div>

          {/* No accounts warning */}
          {!loadingAcc && accounts.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="mono text-[11px] text-amber-700">
                You need to add an account first before adding transactions.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-[12px] h-9 border-stone-200 text-stone-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || accounts.length === 0}
              className={cn(
                "text-white text-[12px] h-9 px-5 transition-colors",
                watchType === "expense"
                  ? "bg-red-500 hover:bg-red-600"
                  : watchType === "income"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-sky-500 hover:bg-sky-600"
              )}
            >
              {form.formState.isSubmitting
                ? <SpinnerBtn label="Adding" />
                : `Add ${watchType}`
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}