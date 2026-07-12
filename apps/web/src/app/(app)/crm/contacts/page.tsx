"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { RefreshCwIcon, UserPlus, Pencil, Trash2 } from "lucide-react"

import { contactsApi, ApiClientError } from "@/lib/api/contacts"
import type { ContactData } from "@/lib/api/types"
import { ContactFormModal } from "@/components/contacts/contact-form-modal"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useMe } from "@/components/layout/use-me"

type TypeFilter = "all" | "person" | "company"
type StatusFilter = "all" | "active" | "inactive"

function getDisplayName(contact: ContactData): string {
  if (contact.type === "company") {
    return contact.companyName || "—"
  }
  return [contact.lastName, contact.firstName].filter(Boolean).join(" ") || "—"
}

export default function ContactListPage() {
  const { me, isAdmin } = useMe()
  const [contacts, setContacts] = useState<ContactData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<ContactData | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchContacts = useCallback(async (type: TypeFilter, status: StatusFilter) => {
    setLoading(true)
    setError(null)
    try {
      const params: { type?: "person" | "company"; status?: string } = {}
      if (type !== "all") params.type = type as "person" | "company"
      if (status !== "all") params.status = status

      const response = await contactsApi.getContacts(
        Object.keys(params).length > 0 ? params : undefined
      )
      setContacts(response.data)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Не удалось загрузить контакты. Попробуйте снова.")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContacts(typeFilter, statusFilter)
  }, [typeFilter, statusFilter, fetchContacts])

  const handleRetry = () => {
    fetchContacts(typeFilter, statusFilter)
  }

  const handleCreated = () => {
    fetchContacts(typeFilter, statusFilter)
  }

  const handleEdit = (contact: ContactData) => {
    setEditingContact(contact)
    setFormOpen(true)
  }

  const handleDelete = async (contact: ContactData) => {
    const name = getDisplayName(contact)
    if (!window.confirm(`Удалить контакт «${name}»?\nКонтакт будет помечен как удалённый.`)) return
    setDeletingId(contact.id)
    try {
      await contactsApi.deleteContact(contact.id)
      fetchContacts(typeFilter, statusFilter)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Не удалось удалить контакт.")
      }
    } finally {
      setDeletingId(null)
    }
  }

  const handleFormSuccess = () => {
    setFormOpen(false)
    setEditingContact(null)
    fetchContacts(typeFilter, statusFilter)
  }

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open)
    if (!open) setEditingContact(null)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Контакты</h1>
        <Button onClick={() => { setEditingContact(null); setFormOpen(true) }}>
          <UserPlus className="size-4" />
          Создать контакт
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">Тип</label>
              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  if (value) setTypeFilter(value as TypeFilter)
                }}
                items={{ all: "Все типы", person: "Физлица", company: "Юрлица" }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Все типы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Все типы</SelectItem>
                    <SelectItem value="person">Физлица</SelectItem>
                    <SelectItem value="company">Юрлица</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">Статус</label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  if (value) setStatusFilter(value as StatusFilter)
                }}
                items={{ all: "Все статусы", active: "Активные", inactive: "Неактивные" }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="active">Активные</SelectItem>
                    <SelectItem value="inactive">Неактивные</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <RefreshCwIcon className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Загрузка контактов...</span>
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" onClick={handleRetry}>
                <RefreshCwIcon className="size-4" />
                <span className="ml-1.5">Повторить</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && contacts.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              Контакты не найдены
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && contacts.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Имя</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Телефон</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="w-24">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <Link
                      href={`/crm/contacts/${contact.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {getDisplayName(contact)}
                    </Link>
                    {"Employees" in contact && (contact as any).Employees?.length > 0 && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {(contact as any).Employees.length} сотр.
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        contact.type === "company" ? "secondary" : "default"
                      }
                    >
                      {contact.type === "company" ? "Юрлицо" : "Физлицо"}
                    </Badge>
                  </TableCell>
                  <TableCell>{contact.phone || "—"}</TableCell>
                  <TableCell>{contact.email || "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        contact.status === "active" ? "default" : "outline"
                      }
                    >
                      {contact.status === "active" ? "Активен" : "Неактивен"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {(isAdmin || contact.ownerId === me?.id) && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handleEdit(contact)}
                        title="Редактировать"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(contact)}
                        disabled={deletingId === contact.id}
                        title="Удалить"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ContactFormModal
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        contact={editingContact}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}
