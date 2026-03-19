type SpinnerBtnProps = {
  label: string
  lightSpinner?: boolean
}

export default function SpinnerBtn({ label, lightSpinner = true }: SpinnerBtnProps) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={`w-3 h-3 rounded-full border-2 animate-spin ${
          lightSpinner
            ? "border-white/30 border-t-white"
            : "border-stone-300 border-t-stone-600"
        }`}
      />
      {label}
    </span>
  )
}