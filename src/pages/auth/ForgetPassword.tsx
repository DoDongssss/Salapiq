import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { forgotPasswordSchema, type ForgotPasswordForm } from "@/schemas/Auth"
import { useState } from "react"
import { ArrowLeft, ArrowRight, MailCheck, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { sendPasswordResetEmail } from "@/services/AuthService"
import { useToast } from "@/hooks/useToast"

export default function ForgotPassword() {
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const [sent, setSent] = useState(false)

  const onSubmit = async (data: ForgotPasswordForm) => {
    const error = await sendPasswordResetEmail(data.email)

    if (error) {
      toast({ type: "error", title: "Failed to send", description: error })
      return
    }

    toast({ type: "success", title: "Reset link sent!", description: "Check your inbox for the reset link." })
    setSent(true)
  }

  return (
    <>
      <div className="salapiq-root h-screen w-full flex items-center justify-center bg-[#f7f5f0] p-4">
        <div className="w-full max-w-[760px] min-h-[460px] flex rounded-2xl overflow-hidden shadow-[0_8px_60px_rgba(0,0,0,0.10)] border border-stone-200/80">

          {/* ── Left: Brand panel ── */}
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
                Happens to<br />
                <span className="text-emerald-400 font-medium">the best of us.</span>
              </h2>
            </div>

            <div className="relative z-10">
              <p className="mono text-[10px] text-white/25 tracking-[0.15em] uppercase mb-4">Recovery steps</p>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Enter your email",    done: true,  active: !sent },
                  { label: "Check your inbox",    done: sent,  active: sent  },
                  { label: "Reset your password", done: false, active: false },
                ].map(({ label, done, active }, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={cn(
                      "step-dot w-5 h-5 rounded-full border flex items-center justify-center shrink-0",
                      done && !active ? "bg-emerald-500 border-emerald-500"
                        : active     ? "border-emerald-400 bg-emerald-400/15"
                        :              "border-white/15 bg-transparent"
                    )}>
                      {done && !active ? (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.5 2.5L8 3" stroke="#0f1a12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <span className={cn("w-1.5 h-1.5 rounded-full", active ? "bg-emerald-400" : "bg-white/20")} />
                      )}
                    </div>
                    <span className={cn(
                      "text-[12px] font-light",
                      active ? "text-white/85" : done ? "text-emerald-400/70" : "text-white/25"
                    )}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 flex items-center gap-2">
              <Sparkles size={12} className="text-emerald-400 ai-badge" />
              <span className="mono text-[10px] text-white/30 tracking-wide">
                Insights powered by AI
              </span>
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

              {!sent ? (
                <>
                  <div className="mb-8">
                    <h1 className="text-[22px] font-semibold text-stone-900 tracking-tight leading-tight">
                      Forgot password?
                    </h1>
                    <p className="text-stone-400 text-sm mt-1.5 font-light leading-relaxed">
                      Enter your email and we'll send a reset link right away.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="email" className="mono text-[10px] tracking-[0.12em] uppercase text-stone-400">
                        Email address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="juan@example.com"
                        autoComplete="email"
                        className={cn(
                          "h-10 text-sm bg-stone-50 border-stone-200 text-stone-900 placeholder:text-stone-300",
                          "focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 transition-colors duration-150",
                          errors.email && "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-400/20"
                        )}
                        {...register("email")}
                      />
                      {errors.email && (
                        <p className="mono text-[11px] text-red-400">— {errors.email.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className={cn(
                        "submit-btn w-full h-10",
                        "bg-emerald-600 hover:bg-emerald-700 text-white",
                        "text-[12px] tracking-[0.06em] uppercase font-medium",
                        "transition-colors duration-150 disabled:opacity-40"
                      )}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Sending link
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          Send reset link
                          <ArrowRight size={13} className="submit-arrow" />
                        </span>
                      )}
                    </Button>
                  </form>
                </>
              ) : (
                <div className="success-reveal flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-6 icon-pulse">
                    <MailCheck size={26} className="text-emerald-600" />
                  </div>
                  <h1 className="text-[20px] font-semibold text-stone-900 tracking-tight mb-2">
                    Check your inbox
                  </h1>
                  <p className="text-stone-400 text-sm font-light leading-relaxed mb-1">
                    We sent a reset link to
                  </p>
                  <p className="mono text-[13px] text-emerald-600 font-medium mb-7">
                    {getValues("email")}
                  </p>
                  <div className="w-full rounded-xl bg-stone-50 border border-stone-100 px-4 py-3.5 mb-7">
                    <p className="mono text-[11px] text-stone-400 leading-relaxed text-left">
                      Didn't receive it? Check your spam folder or wait a few minutes.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSent(false)}
                    className="w-full h-10 text-[12px] tracking-wide text-stone-600 border-stone-200 hover:bg-stone-50 hover:border-stone-300 transition-colors"
                  >
                    Try a different email
                  </Button>
                </div>
              )}

              <a
                href="/auth/login"
                className="flex items-center justify-center gap-1.5 mt-7 mono text-[11px] text-stone-300 hover:text-emerald-600 transition-colors group"
              >
                <ArrowLeft size={11} className="group-hover:-translate-x-0.5 transition-transform" />
                Back to sign in
              </a>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}