"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Phone,
  Calendar,
  Mail,
  FileText,
  CheckSquare,
  Loader2,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getContactInteractions } from "@/lib/api/interactions";
import { ApiClientError } from "@/lib/api/shared";

interface TimelineAuthor {
  name: string;
}

interface TimelineItem {
  id: string;
  type: string;
  direction?: string | null;
  subject?: string | null;
  content?: string | null;
  scheduledAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  author?: TimelineAuthor | null;
}

const typeConfig: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; label: string; variant: "default" | "secondary" | "outline" | "ghost" }
> = {
  call: { icon: Phone, label: "Call", variant: "default" },
  meeting: { icon: Calendar, label: "Meeting", variant: "secondary" },
  email: { icon: Mail, label: "Email", variant: "outline" },
  note: { icon: FileText, label: "Note", variant: "ghost" },
  task: { icon: CheckSquare, label: "Task", variant: "outline" },
};

const defaultTypeConfig = {
  icon: MessageSquare,
  label: "Interaction",
  variant: "outline" as const,
};

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

function contentPreview(content: string | null | undefined, maxLen = 120): string | null {
  if (!content) return null;
  if (content.length <= maxLen) return content;
  return content.slice(0, maxLen) + "…";
}

interface InteractionTimelineProps {
  contactId: string;
}

export function InteractionTimeline({ contactId }: InteractionTimelineProps) {
  const [items, setItems] = useState<TimelineItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getContactInteractions(contactId);
      setItems(response.data as unknown as TimelineItem[]);
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Failed to load interactions";
      console.error("InteractionTimeline fetch error:", err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        Loading interactions…
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
        <Button variant="outline" size="sm" onClick={fetchTimeline}>
          Retry
        </Button>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        No interactions yet
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const config = typeConfig[item.type] ?? defaultTypeConfig;
        const Icon = config.icon;
        return (
          <Card key={item.id} size="sm">
            <CardContent>
              <div className="flex items-start gap-3">
                <Badge variant={config.variant} className="mt-0.5 shrink-0 gap-1">
                  <Icon className="size-3" />
                  {config.label}
                </Badge>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(item.createdAt)}</span>
                    {item.author && <span>— {item.author.name}</span>}
                  </div>
                  {item.subject && (
                    <p className="mt-0.5 text-sm font-medium truncate">
                      {item.subject}
                    </p>
                  )}
                  {item.content && (
                    <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                      {contentPreview(item.content)}
                    </p>
                  )}
                  {item.direction && (
                    <span className="mt-1 inline-block text-xs text-muted-foreground capitalize">
                      {item.direction}
                    </span>
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
