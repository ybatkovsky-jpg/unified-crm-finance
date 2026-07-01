"use client"

/**
 * DealContactsSection — блок «Контактные лица» на странице сделки.
 *
 * Показывает список контактов с ролями, позволяет добавлять/убирать.
 */
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Plus, X, Search, User, Building2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { contactsApi } from "@/lib/api/contacts"
import type { ContactData } from "@/lib/api/types"

type ContactRole = "customer" | "designer" | "installer" | "other"

const ROLE_LABELS: Record<string, string> = {
  customer: "Заказчик",
  designer: "Дизайнер",
  installer: "Монтажник",
  other: "Другое",
}

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
  }
}

function displayName(c: DealContactItem["Contact"]): string {
  if (c.type === "person") {
    const parts = [c.firstName, c.lastName].filter(Boolean)
    return parts.length > 0 ? parts.join(" ") : c.id
  }
  return c.companyName || c.id
}

export function DealContactsSection({ dealId }: { dealId: string }) {
  const [items, setItems] = useState<DealContactItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showPicker, setShowPicker] = useState(false)
  const [allContacts, setAllContacts] = useState<ContactData[]>([])
  const [search, setSearch] = useState("")
  const [pickerRole, setPickerRole] = useState<ContactRole>("customer")
  const [adding, setAdding] = useState(false)

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/deals/${dealId}/contacts`)
      if (res.ok) {
        const json = await res.json()
        setItems(json.data)
      }
    } catch (err) {
      console.error("Failed to fetch deal contacts:", err)
    } finally {
      setLoading(false)
    }
  }, [dealId])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  const loadAllContacts = useCallback(async () => {
    try {
      const res = await contactsApi.getContacts({})
      setAllContacts(res.data.slice(0, 100))
    } catch (err) {
      console.error("Failed to fetch contacts:", err)
    }
  }, [])

  const handleAdd = async (contactId: string, role: ContactRole) => {
    setAdding(true)
    try {
      await fetch(`/api/deals/${dealId}/contacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId, role }),
      })
      await fetchContacts()
      setShowPicker(false)
      setSearch("")
    } catch (err) {
      console.error("Failed to add contact:", err)
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (contactId: string, role: string) => {
    try {
      await fetch(`/api/deals/${dealId}/contacts?contactId=${contactId}&role=${role}`, {
        method: "DELETE",
      })
      await fetchContacts()
    } catch (err) {
      console.error("Failed to remove contact:", err)
    }
  }

  const filtered = allContacts.filter((c) => {
    const name = c.type === "person"
      ? `${c.firstName ?? ""} ${c.lastName ?? ""}`.toLowerCase()
      : (c.companyName ?? "").toLowerCase()
    return name.includes(search.toLowerCase())
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Контактные лица</CardTitle>
          {loading && <RefreshCw className="size-3.5 animate-spin text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 && !loading && !showPicker && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Нет контактов
          </p>
        )}

        {items.map((item) => (
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
              {ROLE_LABELS[item.role] ?? item.role}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 shrink-0"
              onClick={() => handleRemove(item.Contact.id, item.role)}
            >
              <X className="size-3" />
            </Button>
          </div>
        ))}

        {showPicker ? (
          <div className="border rounded-md space-y-2 p-2">
            <Select
              value={pickerRole}
              onValueChange={(v) => setPickerRole((v as ContactRole) ?? "customer")}
              items={ROLE_LABELS}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_LABELS).map(([r, label]) => (
                  <SelectItem key={r} value={r}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Поиск..."
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
                    onClick={() => handleAdd(contact.id, pickerRole)}
                  >
                    {contact.type === "person" ? (
                      <User className="size-3 text-muted-foreground shrink-0" />
                    ) : (
                      <Building2 className="size-3 text-muted-foreground shrink-0" />
                    )}
                    <span className="flex-1 truncate">
                      {contact.type === "person"
                        ? `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim() || contact.id
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
              onClick={() => setShowPicker(false)}
            >
              Отмена
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              setShowPicker(true)
              loadAllContacts()
            }}
          >
            <Plus className="size-3.5" />
            <span className="ml-1">Добавить контакт</span>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
