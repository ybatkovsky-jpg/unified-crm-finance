"use client";

/**
 * ContactFormModal — create + edit контакта.
 *
 * Два режима:
 *  - CREATE (contact=null): новый контакт
 *  - EDIT   (contact задан): редактирование существующего
 *
 * Два типа:
 *  - person  → имя/фамилия/отчество/должность + выбор юрлица
 *  - company → название/ИНН/КПП/ОГРН + опциональное создание сотрудника
 */
import { useEffect, useState, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { contactsApi, ApiClientError } from "@/lib/api/contacts";
import type { ContactCreateInput, ContactData } from "@/lib/api/types";

interface ContactFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Существующий контакт для редактирования. null = режим CREATE. */
  contact?: ContactData | null;
  /** Предзаполненный companyId (например, при создании сотрудника из карточки юрлица). */
  defaultCompanyId?: string | null;
  /** Вызывается после успешного создания/обновления. */
  onSuccess?: () => void;
}

type ContactType = "person" | "company";

export function ContactFormModal({
  open,
  onOpenChange,
  contact,
  defaultCompanyId,
  onSuccess,
}: ContactFormModalProps) {
  const isEditing = !!contact;

  const [type, setType] = useState<ContactType>("person");
  // Person fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [position, setPosition] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  // Company fields
  const [companyName, setCompanyName] = useState("");
  const [inn, setInn] = useState("");
  const [kpp, setKpp] = useState("");
  const [ogrn, setOgrn] = useState("");
  // Common fields
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  // Employee sub-form (only for company CREATE mode)
  const [addEmployee, setAddEmployee] = useState(false);
  const [empFirstName, setEmpFirstName] = useState("");
  const [empLastName, setEmpLastName] = useState("");
  const [empPhone, setEmpPhone] = useState("");
  const [empPosition, setEmpPosition] = useState("");

  // Company list for person→company linking
  const [companies, setCompanies] = useState<ContactData[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load companies for dropdown ──
  const loadCompanies = useCallback(async () => {
    setCompaniesLoading(true);
    try {
      const res = await contactsApi.getContacts({ type: "company" });
      setCompanies(res.data);
    } catch {
      // не критично — список будет пустым
    } finally {
      setCompaniesLoading(false);
    }
  }, []);

  // ── Reset / populate form ──
  useEffect(() => {
    if (!open) return;

    if (contact) {
      // EDIT mode — fill from contact
      setType((contact.type as ContactType) || "person");
      setFirstName(contact.firstName || "");
      setLastName(contact.lastName || "");
      setMiddleName(contact.middleName || "");
      setPosition(contact.position || "");
      setCompanyId((contact as any).companyId || null);
      setCompanyName(contact.companyName || "");
      setInn(contact.inn || "");
      setKpp(contact.kpp || "");
      setOgrn(contact.ogrn || "");
      setPhone(contact.phone || "");
      setEmail(contact.email || "");
      setNotes(contact.notes || "");
      setAddEmployee(false);
    } else {
      // CREATE mode — reset
      setType("person");
      setFirstName("");
      setLastName("");
      setMiddleName("");
      setPosition("");
      setCompanyId(defaultCompanyId ?? null);
      setCompanyName("");
      setInn("");
      setKpp("");
      setOgrn("");
      setPhone("");
      setEmail("");
      setNotes("");
      setAddEmployee(false);
      setEmpFirstName("");
      setEmpLastName("");
      setEmpPhone("");
      setEmpPosition("");
    }
    setError(null);

    // Preload companies for person dropdown
    loadCompanies();
  }, [open, contact, defaultCompanyId, loadCompanies]);

  // ── Submit ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (type === "person" && !firstName.trim()) {
      setError("Укажите имя для физлица.");
      return;
    }
    if (type === "company" && !companyName.trim()) {
      setError("Укажите название компании.");
      return;
    }
    if (!phone.trim() && !addEmployee) {
      setError("Укажите телефон — он обязателен для всех контактов.");
      return;
    }
    // Phone validation: только цифры, +, пробелы, дефисы, скобки
    if (phone.trim()) {
      const cleaned = phone.trim().replace(/[\s\-()]/g, "");
      if (!/^\+?\d{7,15}$/.test(cleaned)) {
        setError("Неверный формат телефона. Допустимы цифры, +, пробелы, дефисы, скобки (7–15 цифр).");
        return;
      }
    }

    // Employee phone validation
    if (addEmployee && empPhone.trim()) {
      const empCleaned = empPhone.trim().replace(/[\s\-()]/g, "");
      if (!/^\+?\d{7,15}$/.test(empCleaned)) {
        setError("Неверный формат телефона сотрудника.");
        return;
      }
    }

    const payload: ContactCreateInput = {
      type,
      phone: phone.trim() || null as any,
      email: email.trim() || null,
      notes: notes.trim() || null,
      companyId: type === "person" ? (companyId || null) : null,
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
      if (isEditing && contact) {
        await contactsApi.updateContact(contact.id, payload as any);
      } else {
        const res = await contactsApi.createContact(payload);

        // If creating a company with an inline employee, create the employee too
        if (type === "company" && addEmployee && empFirstName.trim()) {
          try {
            await contactsApi.createContact({
              type: "person",
              firstName: empFirstName.trim(),
              lastName: empLastName.trim() || null,
              position: empPosition.trim() || null,
              phone: empPhone.trim() || phone.trim(),
              companyId: res.data.id,
            });
          } catch (empErr) {
            console.error("Failed to create employee:", empErr);
            // Не ломаем основной поток — компания создана
          }
        }
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Не удалось сохранить контакт. Попробуйте снова."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render ──
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="size-4" />
            {isEditing ? "Редактировать контакт" : "Новый контакт"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Измените данные контакта."
              : "Создайте физическое или юридическое лицо."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type switch — only in CREATE mode */}
          {!isEditing && (
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
          )}

          {/* Type-specific fields */}
          {type === "person" ? (
            <div className="space-y-3">
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
              {/* Company link */}
              <Field label="Организация">
                {companiesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Загрузка…
                  </div>
                ) : (
                  <Select
                    value={companyId || "__none__"}
                    onValueChange={(v) => setCompanyId(v === "__none__" ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Без организации" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="__none__">Без организации</SelectItem>
                        {companies.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.companyName} {c.inn ? `(ИНН ${c.inn})` : ""}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              </Field>
            </div>
          ) : (
            <div className="space-y-3">
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
              {/* Inline employee — only for CREATE company mode */}
              {!isEditing && (
                <div className="border rounded-lg p-3 space-y-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={addEmployee}
                      onChange={(e) => setAddEmployee(e.target.checked)}
                      className="rounded"
                    />
                    + Добавить сотрудника
                  </label>
                  {addEmployee && (
                    <div className="grid grid-cols-2 gap-2 pl-1">
                      <Input value={empFirstName} onChange={(e) => setEmpFirstName(e.target.value)} placeholder="Имя *" />
                      <Input value={empLastName} onChange={(e) => setEmpLastName(e.target.value)} placeholder="Фамилия" />
                      <Input value={empPhone} onChange={(e) => setEmpPhone(e.target.value)} placeholder="Телефон" type="tel" />
                      <Input value={empPosition} onChange={(e) => setEmpPosition(e.target.value)} placeholder="Должность" />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Common contact fields */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Телефон" required={!isEditing || type === "company"}>
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
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting
                ? "Сохранение…"
                : isEditing
                ? "Сохранить"
                : "Создать контакт"}
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
