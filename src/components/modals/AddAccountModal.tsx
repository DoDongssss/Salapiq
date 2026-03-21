import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import { useAccountStore } from "@/stores/useAccountStore"
import {
  accountSchema, type AccountForm, type Account,
  ACCOUNT_TYPES, ACCOUNT_PROVIDERS, ACCOUNT_COLORS,
} from "@/types/AccountTypes"
import { createAccount, updateAccount } from "@/services/AccountService"
import SettingsSelect from "@/components/customs/SettingsSelect"
import SpinnerBtn from "@/components/customs/SpinnerBtn"
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  account?: Account | null
  onClose:  () => void
}

export default function AddAccountModal({ account, onClose }: Props) {
  const { user }  = useAuth()
  const { toast } = useToast()
  const refresh   = useAccountStore((s) => s.refresh)

  const form = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name:     "",
      type:     "bank",
      provider: "",
      balance:  0,
      currency: "PHP",
      color:    "#10b981",
      icon:     "wallet",
    },
  })

  const watchType  = form.watch("type")
  const watchColor = form.watch("color")

  useEffect(() => {
    if (account) {
      form.reset({
        name:     account.name,
        type:     account.type,
        provider: account.provider ?? "",
        balance:  account.balance  ?? 0,
        currency: account.currency,
        color:    account.color,
        icon:     account.icon,
      })
    } else {
      form.reset({ name: "", type: "bank", provider: "", balance: 0, currency: "PHP", color: "#10b981", icon: "wallet" })
    }
  }, [account])

  const onSubmit = async (data: AccountForm) => {
    if (!user) return

    if (account) {
      const error = await updateAccount(account.id, data)
      if (error) {
        toast({ type: "error", title: "Update failed", description: error })
      } else {
        toast({ type: "success", title: "Account updated" })
        await refresh(user.id)
        onClose()
      }
    } else {
      const { error } = await createAccount(user.id, data)
      if (error) {
        toast({ type: "error", title: "Failed to create", description: error })
      } else {
        toast({ type: "success", title: "Account created" })
        await refresh(user.id)
        onClose()
      }
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-100">
          <h2 className="text-[15px] font-semibold text-stone-900">
            {account ? "Edit account" : "Add account"}
          </h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Account name</Label>
            <Input
              placeholder="e.g. BDO Savings, GCash"
              className={cn("h-10 text-sm bg-stone-50 border-stone-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20", form.formState.errors.name && "border-red-300")}
              {...form.register("name")}
            />
            {form.formState.errors.name && <p className="mono text-[10px] text-red-400">— {form.formState.errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SettingsSelect label="Account type" options={ACCOUNT_TYPES} {...form.register("type")} />
            <SettingsSelect label="Provider" {...form.register("provider")}>
              <option value="">None</option>
              {(ACCOUNT_PROVIDERS[watchType] ?? []).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </SettingsSelect>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Opening balance</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 mono text-[12px] text-stone-400">₱</span>
                <Input type="number" placeholder="0" className="h-10 text-sm bg-stone-50 border-stone-200 pl-7 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20" {...form.register("balance", { valueAsNumber: true })} />
              </div>
            </div>
            <SettingsSelect label="Currency" {...form.register("currency")}>
              {["PHP", "USD", "EUR", "JPY", "SGD"].map((c) => <option key={c} value={c}>{c}</option>)}
            </SettingsSelect>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Color</Label>
            <div className="flex gap-2 flex-wrap">
              {ACCOUNT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => form.setValue("color", color)}
                  className={cn("w-8 h-8 rounded-lg border-2 transition-all", watchColor === color ? "border-stone-900 scale-110" : "border-transparent")}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="text-[12px] h-9 border-stone-200 text-stone-600">Cancel</Button>
            <Button type="submit" disabled={form.formState.isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] h-9 px-5">
              {form.formState.isSubmitting
                ? <SpinnerBtn label={account ? "Saving" : "Creating"} />
                : account ? "Save changes" : "Create account"
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}