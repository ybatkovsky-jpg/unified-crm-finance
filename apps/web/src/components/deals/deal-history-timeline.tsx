"use client";

import { History, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DealHistoryData } from "@/lib/api/types";

interface DealHistoryTimelineProps {
  history: DealHistoryData[] | null | undefined;
  loading?: boolean;
  error?: string | null;
}

function formatDate(dateStr: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

function getUserName(user: { firstName?: string | null; lastName?: string | null; email?: string | null } | null): string {
  if (!user) return "Unknown";
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) return user.firstName;
  if (user.email) return user.email;
  return "Unknown";
}

export function DealHistoryTimeline({ history, loading = false, error = null }: DealHistoryTimelineProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        Loading history…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="size-4" />
          <span className="text-sm">{error}</span>
        </div>
        <Button variant="outline" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        No history yet
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {history.map((item) => {
        const fromStage = item.fromStage?.name ?? "Previous Stage";
        const toStage = item.toStage?.name ?? "New Stage";
        const changedBy = item.changedByUser ? getUserName(item.changedByUser) : "Unknown";

        return (
          <Card key={item.id} size="sm">
            <CardContent>
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="mt-0.5 shrink-0 gap-1">
                  <History className="size-3" />
                  Stage Change
                </Badge>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{fromStage}</span>
                    <ArrowRight className="size-3 text-muted-foreground" />
                    <span className="font-medium">{toStage}</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(item.changedAt)}</span>
                    <span>— {changedBy}</span>
                  </div>
                  {item.comment && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {item.comment}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
