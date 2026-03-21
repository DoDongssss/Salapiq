import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useToast } from "@/hooks/useToast"
import { useAuth } from "@/hooks/useAuth"
import { useSavingsStore } from "@/stores/useSavingsStore"
import { useFamilyStore } from "@/stores/useFamilyStore"
import { goalSchema, type GoalForm, type SavingsGoal } from "@/types/SavingsTypes"
import { createGoal, updateGoal } from "@/services/SavingsService"
import { GOAL_CATEGORIES, GOAL_PRIORITIES } from "@/config/subscriber"
import SpinnerBtn from "@/components/customs/SpinnerBtn"
import { X, Users, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  goal?:   SavingsGoal | null
  onClose: () => void
}

export default function GoalModal({ goal, onClose }: Props) {
  const { user }  = useAuth()
  const { toast } = useToast()
  const refresh   = useSavingsStore((s) => s.refresh)
  const family    = useFamilyStore((s) => s.family)

  const isEdit        = !!goal
  const myRole        = family?.members.find((m) => m.user_id === user?.id)?.role
  const isFamilyAdmin = myRole === "admin"

  const form = useForm<GoalForm>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title:         "",
      category:      "",
      target_amount: 0,
      priority:      "medium",
      target_date:   "",
      family_id:     "",
    },
  })

  const watchFamilyId = form.watch("family_id")
  const isFamily      = watchFamilyId === family?.id

  useEffect(() => {
    if (goal) {
      form.reset({
        title:         goal.title,
        category:      goal.category,
        target_amount: goal.target_amount,
        priority:      goal.priority,
        target_date:   goal.target_date ?? "",
        family_id:     goal.family_id   ?? "",
      })
    } else {
      form.reset({ title: "", category: "", target_amount: 0, priority: "medium", target_date: "", family_id: "" })
    }
  }, [goal])

  const onSubmit = async (data: GoalForm) => {
    if (!user) return

    const payload = {
      ...data,
      target_date: data.target_date || undefined,
      family_id:   data.family_id   || undefined,
    }

    if (isEdit && goal) {
      const error = await updateGoal(goal.id, payload)
      if (error) {
        toast({ type: "error", title: "Update failed", description: error })
      } else {
        toast({ type: "success", title: "Goal updated" })
        await refresh(user.id)
        onClose()
      }
    } else {
      const { error } = await createGoal(user.id, payload)
      if (error) {
        toast({ type: "error", title: "Failed to create", description: error })
      } else {
        toast({ type: "success", title: isFamily ? "Family goal created!" : "Goal created!" })
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

        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-100">
          <h2 className="text-[15px] font-semibold text-stone-900">
            {isEdit ? "Edit goal" : "New savings goal"}
          </h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-5 flex flex-col gap-4">

          {/* Personal / Family toggle — admins only */}
          {family && isFamilyAdmin && (
            <div className="flex flex-col gap-1.5">
              <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Goal type</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => form.setValue("family_id", "")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[12px] font-medium transition-all",
                    !isFamily
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                      : "bg-stone-50 border-stone-200 text-stone-500 hover:border-stone-300"
                  )}
                >
                  <User size={13} /> Personal
                </button>
                <button
                  type="button"
                  onClick={() => form.setValue("family_id", family.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[12px] font-medium transition-all",
                    isFamily
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                      : "bg-stone-50 border-stone-200 text-stone-500 hover:border-stone-300"
                  )}
                >
                  <Users size={13} /> {family.name}
                </button>
              </div>
              {isFamily && (
                <p className="mono text-[10px] text-stone-400">
                  This goal will be visible to all members of {family.name}
                </p>
              )}
            </div>
          )}

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Goal name</Label>
            <Input
              placeholder="e.g. Emergency Fund, New Laptop"
              className={cn("h-10 text-sm bg-stone-50 border-stone-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20", form.formState.errors.title && "border-red-300")}
              {...form.register("title")}
            />
            {form.formState.errors.title && <p className="mono text-[10px] text-red-400">— {form.formState.errors.title.message}</p>}
          </div>

          {/* Category grid */}
          <div className="flex flex-col gap-1.5">
            <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Category</Label>
            <div className="grid grid-cols-4 gap-2">
              {GOAL_CATEGORIES.map(({ value, label, icon }) => {
                const selected = form.watch("category") === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => form.setValue("category", value)}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-[10px] transition-all",
                      selected
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : "border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300"
                    )}
                  >
                    <span className="text-base">{icon}</span>
                    <span className="mono leading-tight text-center">{label}</span>
                  </button>
                )
              })}
            </div>
            {form.formState.errors.category && <p className="mono text-[10px] text-red-400">— {form.formState.errors.category.message}</p>}
          </div>

          {/* Target + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Target amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 mono text-[12px] text-stone-400">₱</span>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className={cn("h-10 text-sm bg-stone-50 border-stone-200 pl-7 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20", form.formState.errors.target_amount && "border-red-300")}
                  {...form.register("target_amount", { valueAsNumber: true })}
                />
              </div>
              {form.formState.errors.target_amount && <p className="mono text-[10px] text-red-400">— {form.formState.errors.target_amount.message}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">Priority</Label>
              <div className="flex gap-1.5">
                {GOAL_PRIORITIES.map(({ value, label }) => {
                  const selected = form.watch("priority") === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => form.setValue("priority", value)}
                      className={cn(
                        "flex-1 h-10 rounded-xl mono text-[11px] border transition-all",
                        selected
                          ? value === "high"   ? "bg-red-50 border-red-300 text-red-600"
                          : value === "medium" ? "bg-amber-50 border-amber-300 text-amber-700"
                                               : "bg-stone-100 border-stone-300 text-stone-700"
                          : "bg-stone-50 border-stone-200 text-stone-400 hover:border-stone-300"
                      )}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Target date */}
          <div className="flex flex-col gap-1.5">
            <Label className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">
              Target date <span className="text-stone-300">(optional)</span>
            </Label>
            <Input
              type="date"
              className="h-10 text-sm bg-stone-50 border-stone-200 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
              {...form.register("target_date")}
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="text-[12px] h-9 border-stone-200 text-stone-600">
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] h-9 px-5">
              {form.formState.isSubmitting
                ? <SpinnerBtn label={isEdit ? "Saving" : "Creating"} />
                : isEdit ? "Save changes" : "Create goal"
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}