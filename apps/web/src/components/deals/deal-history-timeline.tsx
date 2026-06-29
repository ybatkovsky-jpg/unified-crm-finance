"use client";

import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DealHistoryData } from "@/lib/api/types";

interface DealHistoryTimelineProps {
  history?: DealHistoryData[] | null;
}

/** Format a timestamp as "29 июн 2026, 16:35" in Russian. */
function formatDate(dateStr: string | Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

/** Resolve a display name from a user object. */
function getUserName(user: { name?: string | null; email?: string | null } | null | undefined): string {
  if (!user) return "Система";
  return user.name || user.email || "Система";
}

export function DealHistoryTimeline({ history }: DealHistoryTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        История изменений пуста
      </div>
    );
  }

  return (
    <ol className="relative space-y-3 border-l border-border pl-4">
      {history.map((item) => {
        const fromName = item.fromStage?.name;
        const toName = item.toStage?.name ?? "—";
        const toColor = item.toStage?.color || "#94a3b8";

        return (
          <li key={item.id} className="relative">
            {/* Timeline dot, coloured by the target stage */}
            <span
              className="absolute -left-[1.4rem] top-1.5 size-2.5 rounded-full ring-2 ring-background"
              style={{ backgroundColor: toColor }}
            />

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">{fromName ?? "Начальный этап"}</span>
              <ArrowRight className="size-3.5 text-muted-foreground" />
              <span
                className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 font-medium"
                style={{
                  backgroundColor: `${toColor}1a`,
                  color: toColor,
                }}
              >
                {toName}
              </span>
              {item.toStage?.isWonStage && (
                <Badge variant="secondary" className="text-[10px]">выиграно</Badge>
              )}
              {item.toStage?.isLostStage && (
                <Badge variant="outline" className="text-[10px]">потеряно</Badge>
              )}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              <span>{formatDate(item.changedAt)}</span>
              <span className="text-border">•</span>
              <span>{getUserName(item.changedByUser)}</span>
            </div>

            {item.comment && (
              <p className="mt-1.5 text-sm text-muted-foreground">{item.comment}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
