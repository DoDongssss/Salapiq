import { FieldSkeleton } from "@/components/customs/FieldSkeleton"

export default function ProfileFormSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-16 bg-stone-100 rounded animate-pulse" />
          <FieldSkeleton />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-16 bg-stone-100 rounded animate-pulse" />
          <FieldSkeleton />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="h-3 w-20 bg-stone-100 rounded animate-pulse" />
        <FieldSkeleton />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-20 bg-stone-100 rounded animate-pulse" />
          <FieldSkeleton />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-20 bg-stone-100 rounded animate-pulse" />
          <FieldSkeleton />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="h-3 w-16 bg-stone-100 rounded animate-pulse" />
        <FieldSkeleton />
      </div>
    </div>
  )
}