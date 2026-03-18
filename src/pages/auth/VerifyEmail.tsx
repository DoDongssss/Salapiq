import { useLocation, useNavigate } from "react-router-dom"
import { useState } from "react"
import { MailCheck, ArrowLeft, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabaseClient"

export default function VerifyEmail() {
  const location = useLocation()
  const navigate = useNavigate()

  const email = (location.state as { email?: string })?.email ?? ""

  const [resent, setResent] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)

  const handleResend = async () => {
    setResending(true)
    setResendError(null)
    setResent(false)

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    })

    setResending(false)

    if (error) {
      setResendError(error.message)
    } else {
      setResent(true)
    }
  }

  return (
    <>
      <div className="salapiq-root h-screen w-full flex items-center justify-center bg-[#f7f5f0] p-4">
        <div className="card-reveal w-full max-w-[420px]">

          <div className="bg-white rounded-2xl border border-stone-200/80 shadow-[0_8px_60px_rgba(0,0,0,0.08)] px-10 py-12 flex flex-col items-center text-center">

            <div className="flex items-center gap-2 mb-10 self-start">
              <div className="w-7 h-7 rounded-md bg-emerald-500 flex items-center justify-center">
                <span className="text-[#0f1a12] font-semibold text-xs">S</span>
              </div>
              <span className="font-semibold text-stone-800 tracking-tight">Salapiq</span>
            </div>

            <div className="icon-float w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-6">
              <MailCheck size={28} className="text-emerald-600" />
            </div>

            <h1 className="text-[22px] font-semibold text-stone-900 tracking-tight leading-tight mb-2">
              Check your inbox
            </h1>
            <p className="text-stone-400 text-sm font-light leading-relaxed mb-1">
              We sent a confirmation link to
            </p>
            {email && (
              <p className="mono text-[13px] text-emerald-600 font-medium mb-7 break-all">
                {email}
              </p>
            )}

            <div className="w-full rounded-xl bg-stone-50 border border-stone-100 px-5 py-4 mb-7 text-left">
              {[
                "Open the email from Salapiq",
                "Click the \"Confirm your email\" button",
                "You'll be signed in automatically",
              ].map((step, i) => (
                <div key={i} className={cn("flex items-start gap-3", i < 2 && "mb-3")}>
                  <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="mono text-[10px] text-emerald-700 font-medium">{i + 1}</span>
                  </div>
                  <p className="text-stone-500 text-[12px] font-light leading-snug">{step}</p>
                </div>
              ))}
            </div>

            {resent && (
              <div className="resent-badge flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 mb-4 w-full justify-center">
                <MailCheck size={13} className="text-emerald-500" />
                <p className="mono text-[11px] text-emerald-600">Email resent successfully</p>
              </div>
            )}

            {resendError && (
              <div className="error-shake flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3.5 py-2.5 mb-4 w-full">
                <AlertCircle size={13} className="text-red-400 shrink-0 mt-0.5" />
                <p className="mono text-[11px] text-red-500">{resendError}</p>
              </div>
            )}

            {email && (
              <Button
                type="button"
                variant="outline"
                onClick={handleResend}
                disabled={resending}
                className="w-full h-10 text-[12px] tracking-wide text-stone-600 border-stone-200 hover:bg-stone-50 hover:border-stone-300 transition-colors disabled:opacity-40 mb-3"
              >
                {resending ? (
                  <span className="flex items-center gap-2.5">
                    <span className="flex gap-1">
                      <span className="dot-1 w-1.5 h-1.5 rounded-full bg-stone-400 inline-block" />
                      <span className="dot-2 w-1.5 h-1.5 rounded-full bg-stone-400 inline-block" />
                      <span className="dot-3 w-1.5 h-1.5 rounded-full bg-stone-400 inline-block" />
                    </span>
                    Sending
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <RefreshCw size={13} />
                    Resend confirmation email
                  </span>
                )}
              </Button>
            )}

            <button
              type="button"
              onClick={() => navigate("/auth/login")}
              className="flex items-center gap-1.5 mono text-[11px] text-stone-300 hover:text-emerald-600 transition-colors group mt-1"
            >
              <ArrowLeft size={11} className="group-hover:-translate-x-0.5 transition-transform" />
              Back to sign in
            </button>
          </div>

          <p className="mono text-center text-[10px] text-stone-300 mt-4 leading-relaxed">
            Can't find it? Check your spam or promotions folder.
          </p>

        </div>
      </div>
    </>
  )
}