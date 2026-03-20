import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  page:       number
  totalPages: number
  total:      number
  pageSize:   number
  onChange:   (page: number) => void
}

export default function Pagination({ page, totalPages, total, pageSize, onChange }: Props) {
  if (totalPages <= 1) return null

  const from  = (page - 1) * pageSize + 1
  const to    = Math.min(page * pageSize, total)

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | "...")[]>((acc, p, i, arr) => {
      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...")
      acc.push(p)
      return acc
    }, [])

  return (
    <div className="flex items-center justify-between mt-5">

      {/* Count */}
      <p className="mono text-[11px] text-stone-400">
        <span className="text-stone-600 font-medium">{from}–{to}</span> of {total.toLocaleString()}
      </p>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
            page === 1
              ? "text-stone-300 cursor-not-allowed"
              : "text-stone-500 hover:text-stone-800 hover:bg-stone-100 border border-stone-200 hover:border-stone-300"
          )}
        >
          <ChevronLeft size={13} />
        </button>

        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e-${i}`} className="mono text-[11px] text-stone-300 w-6 text-center">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p as number)}
              className={cn(
                "w-8 h-8 rounded-xl mono text-[11px] font-medium transition-all",
                page === p
                  ? "bg-stone-900 text-white shadow-sm"
                  : "text-stone-500 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 hover:border-stone-300"
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
            page === totalPages
              ? "text-stone-300 cursor-not-allowed"
              : "text-stone-500 hover:text-stone-800 hover:bg-stone-100 border border-stone-200 hover:border-stone-300"
          )}
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  )
}