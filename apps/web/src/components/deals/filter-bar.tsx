"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RefreshCwIcon } from "lucide-react"

interface FilterBarProps {
  statusFilter: string
  onStatusChange: (value: string) => void
  onRefresh: () => void
  loading?: boolean
}

export function FilterBar({
  statusFilter,
  onStatusChange,
  onRefresh,
  loading = false,
}: FilterBarProps) {
  return (
    <div className="flex gap-4 items-center">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm text-muted-foreground">Статус</label>
        <Select
          value={statusFilter}
          onValueChange={(value) => onStatusChange(value ?? "all")}
          items={{ all: "Все", open: "Открытые", closed: "Закрытые" }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Все" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">Все</SelectItem>
              <SelectItem value="open">Открытые</SelectItem>
              <SelectItem value="closed">Закрытые</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={onRefresh}
        disabled={loading}
      >
        <RefreshCwIcon className={`size-4 ${loading ? "animate-spin" : ""}`} />
      </Button>
    </div>
  )
}
