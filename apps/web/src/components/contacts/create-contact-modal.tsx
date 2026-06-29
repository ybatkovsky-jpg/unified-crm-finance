"use client";

/**
 * Create-contact modal.
 *
 * Two modes driven by a segmented type switch:
 *  - person  → first/last/middle name, position
 *  - company → company name, INN, KPP, OGRN
 * Phone is always required (matches POST /api/contacts validation).
 * On success, calls onCreated() so the parent can refresh its list.
 */
import { useEffect, useState } from "react";
import { UserPlus, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { contactsApi, ApiClientError } from "@/lib/api/contacts";
import type { ContactCreateInput, ContactData } from "@/lib/api/types";

interface CreateContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the newly created contact; parent should refresh its list. */
  onCreated?: (contact: ContactData) => void;
}

type ContactType = "person" | "company";

export function CreateContactModal({
  open,
  onOpenChange,
  onCreated,
}: CreateContactModalProps) {
  const [type, setType] = useState<ContactType>("person");
  // Person fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [position, setPosition] = useState("");
  // Company fields
  const [companyName, setCompanyName] = useState("");
  const [inn, setInn] = useState("");
  const [kpp, setKpp] = useState("");
  const [ogrn, setOgrn] = useState("");
  // Common fields
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form whenever the modal is (re)opened.
  useEffect(() => {
    if (open) {
      setType("person");
      setFirstName("");
      setLastName("");
      setMiddleName("");
      setPosition("");
      setCompanyName("");
      setInn("");
      setKpp("");
      setOgrn("");
      setPhone("");
      setEmail("");
      setNotes("");
      setError(null);
    }
  }, [open]);

  function resetForm() {
    setFirstName("");
    setLastName("");
    setMiddleName("");
    setPosition("");
    setCompanyName("");
    setInn("");
    setKpp("");
    setOgrn("");
    setPhone("");
    setEmail("");
    setNotes("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side validation mirrors the server (POST /api/contacts).
    if (type === "person" && !firstName.trim()) {
      setError("Укажите имя для физлица.");
      return;
    }
    if (type === "company" && !companyName.trim()) {
      setError("Укажите название компании.");
      return;
    }
    if (!phone.trim()) {
      setError("Укажите телефон — он обязателен для всех контактов.");
      return;
    }

    const payload: ContactCreateInput = {
      type,
      phone: phone.trim(),
      email: email.trim() || null,
      notes: notes.trim() || null,
    };

    if (type === "person") {
      payload.firstName = firstName.trim();
      payload.lastName = lastName.trim() || null;
      payload.middleName = middleName.trim() || null;
      payload.position = position.trim() || null;
    } else {
      payload.companyName = companyName.trim();
      payload.inn = inn.trim() || null;
      payload.kpp = kpp.trim() || null;
      payload.ogrn = ogrn.trim() || null;
    }

    setSubmitting(true);
    try {
      const response = await contactsApi.createContact(payload);
      onCreated?.(response.data);
      resetForm();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Не удалось создать контакт. Попробуйте снова."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-4" />
            Новый контакт
          </DialogTitle>
          <DialogDescription>
            Создайте физическое или юридическое лицо.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type switch */}
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(["person", "company"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  type === t
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "person" ? "Физлицо" : "Юрлицо"}
              </button>
            ))}
          </div>

          {/* Type-specific fields */}
          {type === "person" ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Имя" required>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Иван" autoFocus />
              </Field>
              <Field label="Фамилия">
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Иванов" />
              </Field>
              <Field label="Отчество">
                <Input value={middleName} onChange={(e) => setMiddleName(e.target.value)} placeholder="Иванович" />
              </Field>
              <Field label="Должность">
                <Input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Менеджер" />
              </Field>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Название" required className="col-span-2">
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="ООО «Ромашка»" autoFocus />
              </Field>
              <Field label="ИНН">
                <Input value={inn} onChange={(e) => setInn(e.target.value)} placeholder="7701234567" />
              </Field>
              <Field label="КПП">
                <Input value={kpp} onChange={(e) => setKpp(e.target.value)} placeholder="770101001" />
              </Field>
              <Field label="ОГРН" className="col-span-2">
                <Input value={ogrn} onChange={(e) => setOgrn(e.target.value)} placeholder="1027700132195" />
              </Field>
            </div>
          )}

          {/* Common contact fields */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Телефон" required>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 999 123-45-67" type="tel" />
            </Field>
            <Field label="Email">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ivan@example.com" type="email" />
            </Field>
          </div>

          <Field label="Заметки">
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Доп. информация" />
          </Field>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Создание…
                </>
              ) : (
                "Создать контакт"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Small labelled-field helper to keep the form layout tidy. */
function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  );
}
