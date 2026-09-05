"use client"

/**
 * DealContactsSection — блок на странице сделки.
 *
 * Две зоны:
 * 1. ЗАКАЗЧИК (один) — физлицо или организация.
 *    - Хранится в Deal.contactId (FK на Contact).
 *    - При выборе организации её сотрудники автоматически становятся
 *      контактными лицами сделки (через DealContact).
 *    - Реквизиты заказчика тянутся в договор.
 *
 * 2. КОНТАКТНЫЕ ЛИЦА (много) — любые люди, связанные со сделкой.
 *    - Произвольная роль (свободный текст: "дизайнер", "замерщик" и т.д.).
 *    - Хранится в DealContact { dealId, contactId, role }.
 */
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Plus, X, Search, User, Building2, RefreshCw, UserPlus, Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { contactsApi } from "@/lib/api/contacts"
import { dealsApi } from "@/lib/api/deals"
import type { ContactData } from "@/lib/api/types"
import { AddContactDialog } from "@/components/deals/add-contact-dialog"

// ── Types ──

interface DealContactItem {
  id: string
  role: string
  Contact: {
    id: string
    type: string
    firstName: string | null
    lastName: string | null
    companyName: string | null
    inn: string | null
    phone: string | null
    email: string | null
    companyId: string | null
  }
}

function displayName(c: DealContactItem["Contact"]): string {
  if (c.type === "person") {
    const parts = [c.firstName, c.lastName].filter(Boolean)
    return parts.length > 0 ? parts.join(" ") : c.id
  }
  return c.companyName || c.id
}

// ── Component ──

export function DealContactsSection({
  dealId,
  contactId,
  onCustomerChange,
}: {
  dealId: string
  /** ID текущего заказчика (Deal.contactId). */
  contactId: string | null
  /** Колбэк при смене/удалении заказчика — чтобы страница перезагрузила сделку. */
  onCustomerChange?: () => void
}) {
  const [customer, setCustomer] = useState<DealContactItem["Contact"] | null>(null)
  const [contacts, setContacts] = useState<DealContactItem[]>([])
  const [loading, setLoading] = useState(true)

  // Customer picker
  const [showCustomerPicker, setShowCustomerPicker] = useState(false)
  const [allContacts, setAllContacts] = useState<ContactData[]>([])
  const [search, setSearch] = useState("")

  // Contact picker
  const [showContactPicker, setShowContactPicker] = useState(false)
  const [newRole, setNewRole] = useState("")
  const [adding, setAdding] = useState(false)

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false)

  // ── Fetch deal contacts (excluding customer) ──
  const fetchContacts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/deals/${dealId}/contacts`)
      if (res.ok) {
        const json = await res.json()
        setContacts(json.data)
      }
    } catch (err) {
      console.error("Failed to fetch deal contacts:", err)
    } finally {
      setLoading(false)
    }
  }, [dealId])

  // ── Fetch customer info ──
  const fetchCustomer = useCallback(async () => {
    if (!contactId) {
      setCustomer(null)
      return
    }
    try {
      const res = await fetch(`/api/contacts/${contactId}`)
      if (!res.ok) {
        // 404 = контакт удалён/не найден — тихо показываем «нет клиента»
        setCustomer(null)
        return
      }
      const json = await res.json()
      const c = json.data
      setCustomer({
        id: c.id,
        type: c.type,
        firstName: c.firstName ?? null,
        lastName: c.lastName ?? null,
        companyName: c.companyName ?? null,
        inn: c.inn ?? null,
        phone: c.phone ?? null,
        email: c.email ?? null,
        companyId: c.companyId ?? null,
      })
    } catch {
      setCustomer(null)
    }
  }, [contactId])

  useEffect(() => {
    fetchCustomer()
  }, [fetchCustomer])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  // ── Load all contacts for picker ──
  const loadAllContacts = useCallback(async () => {
    try {
      const res = await contactsApi.getContacts({})
      setAllContacts(res.data.slice(0, 100))
    } catch (err) {
      console.error("Failed to fetch contacts:", err)
    }
  }, [])

  // ── Set customer ( Deal.contactId ) ──
  const handleSetCustomer = async (contact: ContactData) => {
    setAdding(true)
    try {
      await dealsApi.updateDeal(dealId, { contactId: contact.id } as never)

      // Если выбрали организацию — подтянуть её сотрудников как контакты сделки
      if (contact.type === "company") {
        await autoImportEmployees(contact.id)
      }

      await fetchCustomer()
      await fetchContacts()
      setShowCustomerPicker(false)
      setSearch("")
      onCustomerChange?.()
    } catch (err) {
      console.error("Failed to set customer:", err)
    } finally {
      setAdding(false)
    }
  }

  // ── Auto-import employees of a company as deal contacts ──
  const autoImportEmployees = async (companyId: string) => {
    try {
      const res = await contactsApi.getContacts({ type: "person" })
      const employees = res.data.filter((c) => {
        const cid = (c as { companyId?: string | null }).companyId
        return cid === companyId
      })
      // Привязываем каждого сотрудника к сделке с дефолтной ролью
      await Promise.all(
        employees.map((emp) =>
          fetch(`/api/deals/${dealId}/contacts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contactId: emp.id, role: "Сотрудник" }),
          }).catch(() => {}),
        ),
      )
    } catch (err) {
      console.error("Failed to auto-import employees:", err)
    }
  }

  // ── Clear customer ──
  const handleClearCustomer = async () => {
    setAdding(true)
    try {
      await dealsApi.updateDeal(dealId, { contactId: null } as never)
      await fetchCustomer()
      onCustomerChange?.()
    } catch (err) {
      console.error("Failed to clear customer:", err)
    } finally {
      setAdding(false)
    }
  }

  // ── Add contact person ──
  const handleAddContact = async (contactIdToAdd: string, role: string) => {
    setAdding(true)
    try {
      await fetch(`/api/deals/${dealId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: contactIdToAdd, role: role.trim() || "Контакт" }),
      })
      await fetchContacts()
      setShowContactPicker(false)
      setSearch("")
      setNewRole("")
    } catch (err) {
      console.error("Failed to add contact:", err)
    } finally {
      setAdding(false)
    }
  }

  // ── Remove contact person ──
  const handleRemoveContact = async (contactIdToRemove: string, role: string) => {
    try {
      await fetch(
        `/api/deals/${dealId}/contacts?contactId=${contactIdToRemove}&role=${encodeURIComponent(role)}`,
        { method: "DELETE" },
      )
      await fetchContacts()
    } catch (err) {
      console.error("Failed to remove contact:", err)
    }
  }

  const filtered = allContacts.filter((c) => {
    const name =
      c.type === "person"
        ? `${c.firstName ?? ""} ${c.lastName ?? ""}`.toLowerCase()
        : (c.companyName ?? "").toLowerCase()
    return name.includes(search.toLowerCase())
  })

  return (
    <>
      {/* ═══ ЗАКАЗЧИК ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Заказчик</CardTitle>
            {loading && <RefreshCw className="size-3.5 animate-spin text-muted-foreground" />}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {customer ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                {customer.type === "person" ? (
                  <User className="size-4 text-muted-foreground shrink-0" />
                ) : (
                  <Building2 className="size-4 text-muted-foreground shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/crm/contacts/${customer.id}`}
                    className="text-sm font-medium hover:underline truncate block"
                  >
                    {displayName(customer)}
                  </Link>
                  {customer.inn && (
                    <span className="text-xs text-muted-foreground">ИНН: {customer.inn}</span>
                  )}
                  {customer.phone && (
                    <span className="text-xs text-muted-foreground"> · {customer.phone}</span>
                  )}
                </div>
                <Badge variant="default" className="text-[10px] shrink-0">
                  {customer.type === "person" ? "Физлицо" : "Юрлицо"}
                </Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0 text-destructive hover:text-destructive"
                  onClick={handleClearCustomer}
                  disabled={adding}
                >
                  <X className="size-3" />
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Реквизиты заказчика подтягиваются в договор
              </p>
            </div>
          ) : showCustomerPicker ? (
            <div className="border rounded-md space-y-2 p-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск физлица или организации..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={loadAllContacts}
                  className="pl-8 h-8"
                  autoFocus
                />
              </div>
              <div className="max-h-40 overflow-y-auto border rounded-md">
                {filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2 text-center">
                    {allContacts.length === 0 ? "Загрузка..." : "Не найдено"}
                  </p>
                ) : (
                  filtered.map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      disabled={adding}
                      className="w-full text-left px-3 py-1.5 hover:bg-muted flex items-center gap-2 text-sm border-b last:border-b-0 disabled:opacity-50"
                      onClick={() => handleSetCustomer(contact)}
                    >
                      {contact.type === "person" ? (
                        <User className="size-3 text-muted-foreground shrink-0" />
                      ) : (
                        <Building2 className="size-3 text-muted-foreground shrink-0" />
                      )}
                      <span className="flex-1 truncate">
                        {contact.type === "person"
                          ? `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim() ||
                            contact.id
                          : contact.companyName || contact.id}
                      </span>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {contact.type === "person" ? "Физ" : "Юр"}
                      </Badge>
                    </button>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowCustomerPicker(false)}
                >
                  Отмена
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setShowCustomerPicker(true)
                loadAllContacts()
              }}
            >
              <Plus className="size-3.5" />
              <span className="ml-1">Выбрать заказчика</span>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* ═══ КОНТАКТНЫЕ ЛИЦА ═══ */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Контактные лица</CardTitle>
            {contacts.length > 0 && (
              <Badge variant="secondary" className="text-[10px]">{contacts.length}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {contacts.length === 0 && !showContactPicker && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Нет контактных лиц
            </p>
          )}

          {contacts.map((item) => (
            <div key={item.id} className="flex items-center gap-2 p-2 border rounded-md">
              {item.Contact.type === "person" ? (
                <User className="size-4 text-muted-foreground shrink-0" />
              ) : (
                <Building2 className="size-4 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/crm/contacts/${item.Contact.id}`}
                  className="text-sm font-medium hover:underline truncate block"
                >
                  {displayName(item.Contact)}
                </Link>
                {item.Contact.phone && (
                  <span className="text-xs text-muted-foreground">{item.Contact.phone}</span>
                )}
              </div>
              <Badge variant="secondary" className="text-[10px] shrink-0">
                {item.role}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 shrink-0"
                onClick={() => handleRemoveContact(item.Contact.id, item.role)}
              >
                <X className="size-3" />
              </Button>
            </div>
          ))}

          {showContactPicker ? (
            <div className="border rounded-md space-y-2 p-2">
              {/* Роль — свободный ввод */}
              <Input
                placeholder="Роль (дизайнер, замерщик, монтажник...)"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="h-8 text-xs"
              />
              <div className="relative">
                <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск контакта..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={loadAllContacts}
                  className="pl-8 h-8"
                  autoFocus
                />
              </div>
              <div className="max-h-32 overflow-y-auto border rounded-md">
                {filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2 text-center">
                    {allContacts.length === 0 ? "Загрузка..." : "Не найдено"}
                  </p>
                ) : (
                  filtered.map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      disabled={adding}
                      className="w-full text-left px-3 py-1.5 hover:bg-muted flex items-center gap-2 text-sm border-b last:border-b-0 disabled:opacity-50"
                      onClick={() => handleAddContact(contact.id, newRole)}
                    >
                      {contact.type === "person" ? (
                        <User className="size-3 text-muted-foreground shrink-0" />
                      ) : (
                        <Building2 className="size-3 text-muted-foreground shrink-0" />
                      )}
                      <span className="flex-1 truncate">
                        {contact.type === "person"
                          ? `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim() ||
                            contact.id
                          : contact.companyName || contact.id}
                      </span>
                    </button>
                  ))
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setShowContactPicker(false)}
              >
                Отмена
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setShowContactPicker(true)
                  loadAllContacts()
                }}
              >
                <Plus className="size-3.5" />
                <span className="ml-1">Выбрать существующий</span>
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                className="w-full"
                onClick={() => setCreateOpen(true)}
              >
                <UserPlus className="size-3.5" />
                <span className="ml-1">Создать новый контакт</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Диалог создания нового контакта */}
      <AddContactDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        dealId={dealId}
        hasCustomer={!!customer}
        onAdded={() => {
          fetchContacts()
          fetchCustomer()
          onCustomerChange?.()
        }}
      />
    </>
  )
}
