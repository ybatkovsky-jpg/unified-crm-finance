"use client"

import type { LucideIcon } from "lucide-react"
import { Inbox } from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

/**
 * Единое пустое состояние для списков и разделов.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-12 text-center",
        className
      )}
    >
      <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
