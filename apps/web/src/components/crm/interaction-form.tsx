"use client";

import { useState, useCallback } from "react";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createInteraction } from "@/lib/api/interactions";
import { ApiClientError } from "@/lib/api/shared";

const INTERACTION_TYPES = [
  { value: "call", label: "Call" },
  { value: "meeting", label: "Meeting" },
  { value: "email", label: "Email" },
  { value: "note", label: "Note" },
  { value: "task", label: "Task" },
] as const;

const DIRECTIONS = [
  { value: "inbound", label: "Inbound" },
  { value: "outbound", label: "Outbound" },
] as const;

const DIRECTION_TYPES = new Set(["call", "meeting", "email"]);

interface InteractionFormProps {
  contactId: string;
  authorId: string;
  onSuccess?: () => void;
}

export function InteractionForm({
  contactId,
  authorId,
  onSuccess,
}: InteractionFormProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState<string>("");
  const [direction, setDirection] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [completedAt, setCompletedAt] = useState("");

  const resetForm = useCallback(() => {
    setType("");
    setDirection("");
    setSubject("");
    setContent("");
    setScheduledAt("");
    setCompletedAt("");
    setError(null);
  }, []);

  const handleTypeChange = useCallback((value: string | null) => {
    setType(value ?? "");
  }, []);

  const handleDirectionChange = useCallback((value: string | null) => {
    setDirection(value ?? "");
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen) {
        resetForm();
      }
    },
    [resetForm]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitting(true);
      setError(null);

      try {
        await createInteraction({
          contactId,
          type,
          authorId,
          direction: DIRECTION_TYPES.has(type) ? direction || null : null,
          subject: subject || null,
          content: content || null,
          scheduledAt: scheduledAt || null,
          completedAt: completedAt || null,
        });
        setOpen(false);
        resetForm();
        onSuccess?.();
      } catch (err) {
        const message =
          err instanceof ApiClientError ? err.message : "Не удалось создать взаимодействие";
        console.error("InteractionForm submit error:", err);
        setError(message);
      } finally {
        setSubmitting(false);
      }
    },
    [contactId, type, authorId, direction, subject, content, scheduledAt, completedAt, resetForm, onSuccess]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={<Button variant="outline" size="sm" />}
      >
        <Plus className="size-4" />
        Add Interaction
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Interaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Type
            </label>
            <Select value={type} onValueChange={handleTypeChange} items={Object.fromEntries(INTERACTION_TYPES.map((t) => [t.value, t.label]))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {INTERACTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {DIRECTION_TYPES.has(type) && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Direction
              </label>
              <Select value={direction} onValueChange={handleDirectionChange} items={Object.fromEntries(DIRECTIONS.map((d) => [d.value, d.label]))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select direction" />
                </SelectTrigger>
                <SelectContent>
                  {DIRECTIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Subject
            </label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Interaction subject"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Content
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What happened?"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Scheduled
              </label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Completed
              </label>
              <Input
                type="datetime-local"
                value={completedAt}
                onChange={(e) => setCompletedAt(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-1 size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
