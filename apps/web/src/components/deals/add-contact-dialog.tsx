"use client"

/**
 * AddContactDialog — диалог добавления контакта(ов) в сделку.
 *
 * Два режима:
 * 1. "individual" — форма физлица с паспортом.
 * 2. "company" — форма организации + динамический список сотрудников.
 *
 * Использует useAddContactForm для состояния.
 * Отправляет DTO на POST /api/deals/:id/contacts.
 */

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Trash2,
  User,
  Building2,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useAddContactForm,
  type UseAddContactForm,
} from "@/components/deals/use-add-contact-form"
import {
  type PassportData,
} from "@/lib/api/deal-contacts-dto"

interface AddContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dealId: string
  onAdded?: () => void
  /** Текущий contactId сделки — если уже есть заказчик, создание нового заказчика недоступно. */
  hasCustomer?: boolean
}

export function AddContactDialog({
  open,
  onOpenChange,
  dealId,
  onAdded,
  hasCustomer,
}: AddContactDialogProps) {
  const form = useAddContactForm()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    const dto = form.buildDto()
    if (!dto) {
      setError("Заполните обязательные поля (имя для физлица / название для организации)")
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      if (dto.mode === 'company') {
        // Организация → создаём через сервис (POST /contacts с companyId для сотрудников),
        // затем устанавливаем как Deal.contactId.
        const res = await fetch(`/api/deals/${dealId}/contacts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dto),
        })
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.message || "Не удалось создать организацию")
        }
        const json = await res.json()
        // Найти ID организации в результате и установить как contactId сделки
        const companyEntry = json.data?.find((r: { Contact: { type: string } }) => r.Contact.type === 'company')
        if (companyEntry?.Contact?.id) {
          await fetch(`/api/deals/${dealId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contactId: companyEntry.Contact.id }),
          })
        }
      } else {
        // Физлицо — если роль "Заказчик", устанавливаем как Deal.contactId.
        // Иначе — добавляем как контактное лицо (DealContact).
        const isCustomerRole = dto.role.toLowerCase().includes('заказчик')
        if (isCustomerRole && hasCustomer) {
          setError("У сделки уже есть заказчик. Сначала уберите текущего заказчика.")
          setSubmitting(false)
          return
        }

        const res = await fetch(`/api/deals/${dealId}/contacts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dto),
        })
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.message || "Не удалось добавить контакт")
        }
        const json = await res.json()
        // Если роль = заказчик, установить как Deal.contactId
        if (isCustomerRole && json.data?.[0]?.Contact?.id) {
          await fetch(`/api/deals/${dealId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contactId: json.data[0].Contact.id }),
          })
        }
      }

      form.reset()
      onOpenChange(false)
      onAdded?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка")
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset()
      setError(null)
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавить контакт в сделку</DialogTitle>
          <DialogDescription>
            Физлицо с паспортом или организация с сотрудниками
          </DialogDescription>
        </DialogHeader>

        {/* Mode switch */}
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => form.setMode("individual")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              form.mode === "individual"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <User className="size-3.5" />
            Физлицо
          </button>
          <button
            type="button"
            onClick={() => form.setMode("company")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              form.mode === "company"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Building2 className="size-3.5" />
            Организация
          </button>
        </div>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
            {error}
          </div>
        )}

        {form.mode === "individual" ? (
          <IndividualForm form={form} />
        ) : (
          <CompanyForm form={form} />
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={submitting}
          >
            Отмена
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Добавить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Individual form ──

function IndividualForm({ form }: { form: UseAddContactForm }) {
  return (
    <div className="space-y-3">
      {/* Role — свободный ввод */}
      <FormField label="Роль в сделке">
        <Input
          value={form.personRole}
          onChange={(e) => form.setPersonRole(e.target.value)}
          placeholder="Заказчик, дизайнер, замерщик..."
        />
      </FormField>

      {/* Name fields */}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Имя" required>
          <Input
            value={form.person.firstName}
            onChange={(e) => form.updatePerson("firstName", e.target.value)}
            placeholder="Иван"
          />
        </FormField>
        <FormField label="Фамилия">
          <Input
            value={form.person.lastName}
            onChange={(e) => form.updatePerson("lastName", e.target.value)}
            placeholder="Иванов"
          />
        </FormField>
        <FormField label="Отчество">
          <Input
            value={form.person.middleName}
            onChange={(e) => form.updatePerson("middleName", e.target.value)}
            placeholder="Иванович"
          />
        </FormField>
        <FormField label="Должность">
          <Input
            value={form.person.position}
            onChange={(e) => form.updatePerson("position", e.target.value)}
            placeholder="Менеджер"
          />
        </FormField>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Телефон" required>
          <Input
            value={form.person.phone}
            onChange={(e) => form.updatePerson("phone", e.target.value)}
            placeholder="+7 999 123-45-67"
            type="tel"
          />
        </FormField>
        <FormField label="Email">
          <Input
            value={form.person.email}
            onChange={(e) => form.updatePerson("email", e.target.value)}
            placeholder="ivan@example.com"
            type="email"
          />
        </FormField>
      </div>

      {/* Passport */}
      <PassportFields
        passport={form.person.passport}
        onUpdate={form.updatePassport}
      />
    </div>
  )
}

// ── Company form ──

function CompanyForm({ form }: { form: UseAddContactForm }) {
  return (
    <div className="space-y-4">
      {/* Company role — свободный ввод */}
      <FormField label="Роль организации">
        <Input
          value={form.companyRole}
          onChange={(e) => form.setCompanyRole(e.target.value)}
          placeholder="Заказчик..."
        />
      </FormField>

      {/* Company fields */}
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Название" required className="col-span-2">
          <Input
            value={form.company.companyName}
            onChange={(e) => form.updateCompany("companyName", e.target.value)}
            placeholder="ООО «Ромашка»"
          />
        </FormField>
        <FormField label="ИНН">
          <Input
            value={form.company.inn}
            onChange={(e) => form.updateCompany("inn", e.target.value)}
            placeholder="7701234567"
          />
        </FormField>
        <FormField label="КПП">
          <Input
            value={form.company.kpp}
            onChange={(e) => form.updateCompany("kpp", e.target.value)}
            placeholder="770101001"
          />
        </FormField>
        <FormField label="ОГРН" className="col-span-2">
          <Input
            value={form.company.ogrn}
            onChange={(e) => form.updateCompany("ogrn", e.target.value)}
            placeholder="1027700132195"
          />
        </FormField>
        <FormField label="Телефон">
          <Input
            value={form.company.phone}
            onChange={(e) => form.updateCompany("phone", e.target.value)}
            placeholder="+7 495 123-45-67"
            type="tel"
          />
        </FormField>
        <FormField label="Email">
          <Input
            value={form.company.email}
            onChange={(e) => form.updateCompany("email", e.target.value)}
            placeholder="info@example.com"
            type="email"
          />
        </FormField>
        <FormField label="Адрес" className="col-span-2">
          <Input
            value={form.company.address}
            onChange={(e) => form.updateCompany("address", e.target.value)}
            placeholder="г. Москва, ул. Ленина, д. 1"
          />
        </FormField>
      </div>

      {/* Employees */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Сотрудники</Label>
          <Button type="button" variant="outline" size="sm" onClick={form.addEmployee}>
            <Plus className="size-3.5" />
            <span className="ml-1">Добавить</span>
          </Button>
        </div>

        {form.employees.length === 0 && (
          <p className="text-sm text-muted-foreground py-2 text-center border rounded-md">
            Нет сотрудников. Можно добавить позже.
          </p>
        )}

        {form.employees.map((emp, idx) => (
          <EmployeeRowForm
            key={emp.tempId}
            index={idx}
            employee={emp}
            form={form}
          />
        ))}
      </div>
    </div>
  )
}

// ── Employee row (collapsible) ──

function EmployeeRowForm({
  index,
  employee,
  form,
}: {
  index: number
  employee: UseAddContactForm["employees"][number]
  form: UseAddContactForm
}) {
  const [expanded, setExpanded] = useState(false)
  const name = `${employee.person.firstName} ${employee.person.lastName}`.trim()

  return (
    <div className="border rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          {expanded ? (
            <ChevronUp className="size-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground shrink-0" />
          )}
          <span className="text-sm font-medium truncate">
            {name || `Сотрудник ${index + 1}`}
          </span>
          <Badge variant="secondary" className="text-[10px] shrink-0">
            {employee.role || "Сотрудник"}
          </Badge>
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-destructive hover:text-destructive"
          onClick={() => form.removeEmployee(employee.tempId)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>

      {/* Expanded fields */}
      {expanded && (
        <div className="space-y-3 px-3 pb-3 border-t">
          <div className="grid grid-cols-2 gap-3 pt-3">
            <FormField label="Имя" required>
              <Input
                value={employee.person.firstName}
                onChange={(e) =>
                  form.updateEmployeePerson(employee.tempId, "firstName", e.target.value)
                }
                placeholder="Пётр"
              />
            </FormField>
            <FormField label="Фамилия">
              <Input
                value={employee.person.lastName}
                onChange={(e) =>
                  form.updateEmployeePerson(employee.tempId, "lastName", e.target.value)
                }
                placeholder="Петров"
              />
            </FormField>
            <FormField label="Телефон">
              <Input
                value={employee.person.phone}
                onChange={(e) =>
                  form.updateEmployeePerson(employee.tempId, "phone", e.target.value)
                }
                placeholder="+7 999 000-00-00"
                type="tel"
              />
            </FormField>
            <FormField label="Email">
              <Input
                value={employee.person.email}
                onChange={(e) =>
                  form.updateEmployeePerson(employee.tempId, "email", e.target.value)
                }
                placeholder="petr@example.com"
                type="email"
              />
            </FormField>
          </div>

          <FormField label="Роль">
            <Input
              value={employee.role}
              onChange={(e) =>
                form.updateEmployeeRole(employee.tempId, e.target.value)
              }
              placeholder="Дизайнер, замерщик, монтажник..."
            />
          </FormField>

          <PassportFields
            passport={employee.person.passport}
            onUpdate={(key, value) =>
              form.updateEmployeePassport(employee.tempId, key, value)
            }
          />
        </div>
      )}
    </div>
  )
}

// ── Passport fields (collapsible sub-block) ──

function PassportFields({
  passport,
  onUpdate,
}: {
  passport: PassportData
  onUpdate: <K extends keyof PassportData>(key: K, value: PassportData[K]) => void
}) {
  const [show, setShow] = useState(false)

  return (
    <div className="border rounded-lg">
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted/50"
      >
        <span>Паспортные данные</span>
        {show ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>
      {show && (
        <div className="grid grid-cols-2 gap-3 px-3 pb-3">
          <FormField label="Серия">
            <Input
              value={passport.passportSeries ?? ""}
              onChange={(e) => onUpdate("passportSeries", e.target.value || null)}
              placeholder="0000"
            />
          </FormField>
          <FormField label="Номер">
            <Input
              value={passport.passportNumber ?? ""}
              onChange={(e) => onUpdate("passportNumber", e.target.value || null)}
              placeholder="000000"
            />
          </FormField>
          <FormField label="Кем выдан" className="col-span-2">
            <Input
              value={passport.passportIssuedBy ?? ""}
              onChange={(e) => onUpdate("passportIssuedBy", e.target.value || null)}
              placeholder="Отделом УФМС..."
            />
          </FormField>
          <FormField label="Дата выдачи">
            <Input
              value={passport.passportIssuedAt ?? ""}
              onChange={(e) => onUpdate("passportIssuedAt", e.target.value || null)}
              type="date"
            />
          </FormField>
          <FormField label="Код подразделения">
            <Input
              value={passport.passportCode ?? ""}
              onChange={(e) => onUpdate("passportCode", e.target.value || null)}
              placeholder="000-000"
            />
          </FormField>
          <FormField label="Адрес регистрации" className="col-span-2">
            <Input
              value={passport.registrationAddress ?? ""}
              onChange={(e) => onUpdate("registrationAddress", e.target.value || null)}
              placeholder="г. Москва, ул. ..."
            />
          </FormField>
        </div>
      )}
    </div>
  )
}

// ── Form field wrapper ──

function FormField({
  label,
  required,
  className,
  children,
}: {
  label: string
  required?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  )
}
