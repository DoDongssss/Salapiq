import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff, ArrowRight, AlertCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { updatePassword } from "@/services/authService"
import { useToast } from "@/hooks/useToast"

const resetSchema = z
  .object({
    password: z.string().min(6, "min 6 chars"),
    confirmPassword: z.string().min(1, "required"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "passwords don't match",
    path: ["confirmPassword"],
  })

type ResetForm = z.infer<typeof resetSchema>

function parseHashError() {
  const hash = window.location.hash
  if (!hash) return null
  const params = new URLSearchParams(hash.replace("#", ""))
  const error = params.get("error")
  const desc = params.get("error_description")
  if (error) return desc?.replace(/\+/g, " ") ?? "Link is invalid or has expired."
  return null
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [hashError] = useState(() => parseHashError())
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  })

  const onSubmit = async (data: ResetForm) => {
    const error = await updatePassword(data.password)

    if (error) {
      toast({ type: "error", title: "Reset failed", description: error })
      return
    }

    toast({ type: "success", title: "Password updated!", description: "You can now sign in with your new password." })
    navigate("/auth/login", { replace: true })
  }

  return (
    <>
      <div className="salapiq-root h-screen w-full flex items-center justify-center bg-[#f7f5f0] p-4">
        <div className="w-full max-w-[760px] min-h-[460px] flex rounded-2xl overflow-hidden shadow-[0_8px_60px_rgba(0,0,0,0.10)] border border-stone-200/80">

          <div className="panel-reveal hidden md:flex flex-col justify-between w-[44%] bg-[#0f1a12] p-10 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />
              <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-emerald-400/8 blur-2xl" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2.5 mb-10">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <span className="text-[#0f1a12] font-semibold text-sm">S</span>
                </div>
                <span className="text-white font-semibold text-lg tracking-tight">Salapiq</span>
              </div>
              <p className="mono text-[10px] tracking-[0.2em] text-emerald-500/70 uppercase mb-4">
                Account recovery
              </p>
              <h2 className="text-white text-[26px] font-light leading-[1.2] tracking-tight">
                Almost there,<br />
                <span className="text-emerald-400 font-medium">set a new password.</span>
              </h2>
            </div>
            <div className="relative z-10 flex flex-col gap-3">
              {[
                { label: "Enter your email",    done: true  },
                { label: "Check your inbox",    done: true  },
                { label: "Reset your password", done: false },
              ].map(({ label, done }, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={cn(
                    "w-5 h-5 rounded-full border flex items-center justify-center shrink-0",
                    done ? "bg-emerald-500 border-emerald-500" : "border-emerald-400 bg-emerald-400/15"
                  )}>
                    {done ? (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="#0f1a12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </div>
                  <span className={cn("text-[12px] font-light", done ? "text-emerald-400/70" : "text-white/85")}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <div className="relative z-10 flex items-center gap-2">
              <Sparkles size={12} className="text-emerald-400 ai-badge" />
              <span className="mono text-[10px] text-white/30 tracking-wide">Insights powered by AI</span>
            </div>
          </div>

          <div className="form-reveal flex-1 bg-white flex items-center justify-center px-10 py-12">
            <div className="w-full max-w-[290px]">

              <div className="flex md:hidden items-center gap-2 mb-8">
                <div className="w-7 h-7 rounded-md bg-emerald-500 flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">S</span>
                </div>
                <span className="font-semibold text-stone-800 tracking-tight">Salapiq</span>
              </div>

              {hashError ? (
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mb-6">
                    <AlertCircle size={26} className="text-red-400" />
                  </div>
                  <h1 className="text-[20px] font-semibold text-stone-900 tracking-tight mb-2">
                    Link expired
                  </h1>
                  <p className="mono text-[11px] text-stone-400 leading-relaxed mb-7">
                    {hashError}
                  </p>
                  <Button
                    type="button"
                    onClick={() => navigate("/auth/forget-password")}
                    className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] tracking-[0.06em] uppercase font-medium transition-colors"
                  >
                    Request a new link
                  </Button>
                  <a href="/auth/login" className="mt-5 mono text-[11px] text-stone-300 hover:text-emerald-600 transition-colors">
                    Back to sign in
                  </a>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <h1 className="text-[22px] font-semibold text-stone-900 tracking-tight leading-tight">
                      Set new password
                    </h1>
                    <p className="text-stone-400 text-sm mt-1.5 font-light leading-relaxed">
                      Choose a strong password for your account.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="password" className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">
                        New password
                      </Label>
                      <div className="relative">
                        <Input id="password" type={showPassword ? "text" : "password"} placeholder="Min. 6 characters" autoComplete="new-password"
                          className={cn("h-10 text-sm bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-300 pr-10", "focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 transition-colors duration-150", errors.password && "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-400/20")}
                          {...register("password")}
                        />
                        <button type="button" tabIndex={-1} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition-colors">
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      {errors.password && <p className="mono text-[11px] text-red-400">— {errors.password.message}</p>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="confirmPassword" className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">
                        Confirm password
                      </Label>
                      <div className="relative">
                        <Input id="confirmPassword" type={showConfirm ? "text" : "password"} placeholder="••••••••" autoComplete="new-password"
                          className={cn("h-10 text-sm bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-300 pr-10", "focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 transition-colors duration-150", errors.confirmPassword && "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-400/20")}
                          {...register("confirmPassword")}
                        />
                        <button type="button" tabIndex={-1} onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition-colors">
                          {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      {errors.confirmPassword && <p className="mono text-[11px] text-red-400">— {errors.confirmPassword.message}</p>}
                    </div>

                    <Button type="submit" disabled={isSubmitting}
                      className={cn("submit-btn w-full h-10 mt-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] tracking-[0.06em] uppercase font-medium transition-colors duration-150 disabled:opacity-40")}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Updating
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Update password <ArrowRight size={13} className="submit-arrow" />
                        </span>
                      )}
                    </Button>
                  </form>

                  <a href="/auth/login" className="flex items-center justify-center mt-7 mono text-[11px] text-stone-300 hover:text-emerald-600 transition-colors">
                    Back to sign in
                  </a>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}