import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/useToast"
import {
  accountSchema, type AccountForm, type Account,
  ACCOUNT_TYPES, ACCOUNT_PROVIDERS, ACCOUNT_COLORS,
} from "@/types/AccountTypes"
import {
createAccount, updateAccount, deleteAccount, getTotalBalance,
} from "@/services/AccountService"
import { useAccountStore } from "@/stores/useAccountStore"
import SettingsSelect from "@/components/customs/SettingsSelect"
import SpinnerBtn from "@/components/customs/SpinnerBtn"
import {
  Plus, Wallet, Building2, CreditCard, Smartphone,
  MoreHorizontal, Pencil, Trash2, X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"


const TYPE_ICONS = {
  bank:    Building2,
  debit:   CreditCard,
  ewallet: Smartphone,
  cash:    Wallet,
}

const TYPE_LABELS = {
  bank:    "Bank account",
  debit:   "Debit card",
  ewallet: "E-wallet",
  cash:    "Cash wallet",
}


export default function Accounts() {
  const { user }  = useAuth()
  const { toast } = useToast()

  const accounts = useAccountStore((s) => s.accounts)
  const loading  = useAccountStore((s) => s.loading)
  const refresh  = useAccountStore((s) => s.refresh)

  const [showModal,   setShowModal]   = useState(false)
  const [editAccount, setEditAccount] = useState<Account | null>(null)
  const [menuOpen,    setMenuOpen]    = useState<string | null>(null)
  const [deleting,    setDeleting]    = useState<string | null>(null)

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

  const openCreate = () => {
    setEditAccount(null)
    form.reset({
      name: "", type: "bank", provider: "",
      balance: 0, currency: "PHP",
      color: "#10b981", icon: "wallet",
    })
    setShowModal(true)
  }

  const openEdit = (account: Account) => {
    setEditAccount(account)
    form.reset({
      name:     account.name,
      type:     account.type,
      provider: account.provider ?? "",
      balance:  account.balance  ?? 0,
      currency: account.currency,
      color:    account.color,
      icon:     account.icon,
    })
    setMenuOpen(null)
    setShowModal(true)
  }

  const onSubmit = async (data: AccountForm) => {
    if (!user) return

    if (editAccount) {
      const error = await updateAccount(editAccount.id, data)
      if (error) {
        toast({ type: "error", title: "Update failed", description: error })
      } else {
        toast({ type: "success", title: "Account updated" })
        setShowModal(false)
        await refresh(user.id)
      }
    } else {
      const { error } = await createAccount(user.id, data)
      if (error) {
        toast({ type: "error", title: "Failed to create", description: error })
      } else {
        toast({ type: "success", title: "Account created" })
        setShowModal(false)
        await refresh(user.id)
      }
    }
  }

  const handleDelete = async (id: string) => {
    if (!user) return
    setDeleting(id)
    const error = await deleteAccount(id)
    setDeleting(null)
    setMenuOpen(null)
    if (error) {
      toast({ type: "error", title: "Failed to delete", description: error })
    } else {
      toast({ type: "info", title: "Account removed" })
      await refresh(user.id)
    }
  }

  const totalBalance = getTotalBalance(accounts)

  return (
    <div className="page-reveal">

      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Accounts</h1>
          <p className="mono text-[11px] text-stone-400 mt-1">Manage your wallets, bank accounts and e-wallets</p>
        </div>
        <Button onClick={openCreate} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] h-9 px-4">
          <Plus size={13} /> Add account
        </Button>
      </div>

      {!loading && accounts.length > 0 && (
        <div className="bg-[#0f1a12] rounded-2xl p-5 mb-5">
          <p className="mono text-[10px] tracking-[0.15em] uppercase text-emerald-900 mb-1">Total balance</p>
          <p className="text-3xl font-semibold text-white tracking-tight">
            ₱{totalBalance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </p>
          <p className="mono text-[10px] text-emerald-900 mt-1">
            {accounts.length} account{accounts.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-stone-200 animate-pulse" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <Wallet size={32} className="text-stone-300 mx-auto mb-3" />
          <p className="text-[14px] font-medium text-stone-600">No accounts yet</p>
          <p className="mono text-[11px] text-stone-400 mt-1 mb-4">
            Add your bank, e-wallet or cash account to start tracking
          </p>
          <Button onClick={openCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] h-9 px-4">
            <Plus size={13} className="mr-1" /> Add your first account
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {accounts.map((account) => {
            const Icon = TYPE_ICONS[account.type]
            return (
              <div key={account.id} className="relative bg-white rounded-2xl border border-stone-200 p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] transition-shadow">

                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: account.color + "20" }}>
                  <Icon size={18} style={{ color: account.color }} />
                </div>

                <p className="text-[13px] font-medium text-stone-800 leading-tight truncate">{account.name}</p>
                <p className="mono text-[10px] text-stone-400 mt-0.5 mb-3">
                  {account.provider ? `${account.provider} · ` : ""}{TYPE_LABELS[account.type]}
                </p>
                <p className="text-[20px] font-semibold text-stone-900 tracking-tight">
                  ₱{account.balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </p>

                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => setMenuOpen(menuOpen === account.id ? null : account.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-300 hover:text-stone-600 hover:bg-stone-50 transition-colors"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  {menuOpen === account.id && (
                    <div className="absolute right-0 top-8 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden z-10 w-36">
                      <button
                        onClick={() => openEdit(account)}
                        className="flex items-center gap-2 w-full px-3 py-2.5 text-[12px] text-stone-700 hover:bg-stone-50 transition-colors"
                      >
                        <Pencil size={12} /> Edit account
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        disabled={deleting === account.id}
                        className="flex items-center gap-2 w-full px-3 py-2.5 text-[12px] text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={12} />
                        {deleting === account.id ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-100">
              <h2 className="text-[15px] font-semibold text-stone-900">
                {editAccount ? "Edit account" : "Add account"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors"
              >
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
                {form.formState.errors.name && (
                  <p className="mono text-[10px] text-red-400">— {form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <SettingsSelect
                  label="Account type"
                  options={ACCOUNT_TYPES}
                  {...form.register("type")}
                />
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
                    <Input
                      type="number"
                      placeholder="0"
                      className="h-10 text-sm bg-stone-50 border-stone-200 pl-7 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
                      {...form.register("balance", { valueAsNumber: true })}
                    />
                  </div>
                </div>
                <SettingsSelect label="Currency" {...form.register("currency")}>
                  {["PHP", "USD", "EUR", "JPY", "SGD"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </SettingsSelect>
              </div>

              {/* Color picker */}
              <div className="flex flex-col gap-1.5">
                <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {ACCOUNT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => form.setValue("color", color)}
                      className={cn(
                        "w-8 h-8 rounded-lg border-2 transition-all",
                        watchColor === color ? "border-stone-900 scale-110" : "border-transparent"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="text-[12px] h-9 border-stone-200 text-stone-600"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] h-9 px-5"
                >
                  {form.formState.isSubmitting
                    ? <SpinnerBtn label={editAccount ? "Saving" : "Creating"} />
                    : editAccount ? "Save changes" : "Create account"
                  }
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}