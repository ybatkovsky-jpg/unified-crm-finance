"use client"

import { useState, useEffect, useCallback, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  RefreshCwIcon, ArrowLeftIcon, PhoneIcon, MailIcon, Building2Icon, UserIcon,
  Pencil, Trash2, UserPlus,
} from "lucide-react"

import { contactsApi, ApiClientError } from "@/lib/api/contacts"
import type { ContactData } from "@/lib/api/types"
import { InteractionTimeline } from "@/components/crm/interaction-timeline"
import { InteractionForm } from "@/components/crm/interaction-form"
import { ContactFormModal } from "@/components/contacts/contact-form-modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useMe } from "@/components/layout/use-me"

// Mock author ID for MVP - will be replaced with real auth context
const MOCK_AUTHOR_ID = "00000000-0000-0000-0000-000000000001"

function getDisplayName(contact: ContactData): string {
  if (contact.type === "company") {
    return contact.companyName || "—"
  }
  return [contact.lastName, contact.firstName].filter(Boolean).join(" ") || "—"
}

type EmployeeInfo = {
  id: string
  firstName: string | null
  lastName: string | null
  position: string | null
  phone: string | null
  email: string | null
}

type CompanyInfo = {
  id: string
  companyName: string | null
}

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const contactId = id
  const router = useRouter()
  const { me, isAdmin } = useMe()
  const [contact, setContact] = useState<ContactData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timelineKey, setTimelineKey] = useState(0)
  const [editOpen, setEditOpen] = useState(false)
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchContact = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await contactsApi.getContact(contactId)
      setContact(response.data)
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.statusCode === 404) {
          setError("Контакт не найден")
        } else {
          setError(err.message)
        }
      } else {
        setError("Не удалось загрузить контакт. Пожалуйста, попробуйте снова.")
      }
      console.error("Contact fetch error:", err)
    } finally {
      setLoading(false)
    }
  }, [contactId])

  useEffect(() => {
    fetchContact()
  }, [fetchContact])

  const handleRetry = () => {
    fetchContact()
  }

  const handleInteractionSuccess = () => {
    setTimelineKey((prev) => prev + 1)
  }

  const handleEditSuccess = () => {
    setEditOpen(false)
    fetchContact()
  }

  const handleDelete = async () => {
    if (!contact) return
    const name = getDisplayName(contact)
    if (!window.confirm(`Удалить контакт «${name}»?\nКонтакт будет помечен как удалённый.`)) return
    setDeleting(true)
    try {
      await contactsApi.deleteContact(contact.id)
      router.push("/crm/contacts")
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Не удалось удалить контакт.")
      }
      setDeleting(false)
    }
  }

  const employees = (contact as any)?.Employees as EmployeeInfo[] | undefined
  const company = (contact as any)?.Company as CompanyInfo | undefined

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCwIcon className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Загрузка контакта...</span>
        </div>
      </div>
    )
  }

  if (error || !contact) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-destructive">{error || "Контакт не найден"}</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleRetry}>
                  <RefreshCwIcon className="size-4" />
                  <span className="ml-1.5">Повторить</span>
                </Button>
                <Link href="/crm/contacts">
                  <Button variant="outline">
                    <ArrowLeftIcon className="size-4" />
                    <span className="ml-1.5">К списку контактов</span>
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back navigation */}
      <Link href="/crm/contacts" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
        <ArrowLeftIcon className="size-4 mr-1" />
        К списку контактов
      </Link>

      {/* Contact details header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {contact.type === "company" ? (
                  <Building2Icon className="size-5 text-muted-foreground" />
                ) : (
                  <UserIcon className="size-5 text-muted-foreground" />
                )}
                <CardTitle className="text-2xl">{getDisplayName(contact)}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={contact.type === "company" ? "secondary" : "default"}
                >
                  {contact.type === "company" ? "Юрлицо" : "Физлицо"}
                </Badge>
                <Badge
                  variant={contact.status === "active" ? "default" : "outline"}
                >
                  {contact.status === "active" ? "Активен" : "Неактивен"}
                </Badge>
              </div>
            </div>
            {(isAdmin || contact?.ownerId === me?.id) && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" />
                <span className="ml-1.5">Редактировать</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="size-4" />
                <span className="ml-1.5">{deleting ? "Удаление…" : "Удалить"}</span>
              </Button>
            </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {contact.phone && (
              <div className="flex items-center gap-2 text-sm">
                <PhoneIcon className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Телефон:</span>
                <span>{contact.phone}</span>
              </div>
            )}
            {contact.email && (
              <div className="flex items-center gap-2 text-sm">
                <MailIcon className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span>{contact.email}</span>
              </div>
            )}
            {contact.type === "person" && contact.position && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Должность:</span>
                <span>{contact.position}</span>
              </div>
            )}
            {contact.type === "company" && contact.inn && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">ИНН:</span>
                <span>{contact.inn}</span>
              </div>
            )}
            {contact.type === "company" && contact.kpp && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">КПП:</span>
                <span>{contact.kpp}</span>
              </div>
            )}
            {contact.type === "company" && contact.ogrn && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">ОГРН:</span>
                <span>{contact.ogrn}</span>
              </div>
            )}
            {/* Company link for person contacts */}
            {contact.type === "person" && company && (
              <div className="flex items-center gap-2 text-sm col-span-2">
                <Building2Icon className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Организация:</span>
                <Link href={`/crm/contacts/${company.id}`} className="text-primary hover:underline">
                  {company.companyName || "—"}
                </Link>
              </div>
            )}
          </div>
          {contact.address && (
            <div className="mt-4 text-sm">
              <span className="text-muted-foreground">Адрес:</span>
              <span className="ml-2">{contact.address}</span>
            </div>
          )}
          {contact.notes && (
            <div className="mt-4 text-sm">
              <span className="text-muted-foreground">Заметки:</span>
              <p className="mt-1 text-muted-foreground">{contact.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employees section (only for company contacts) */}
      {contact.type === "company" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Сотрудники</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setAddEmployeeOpen(true)}>
                <UserPlus className="size-4" />
                <span className="ml-1.5">Добавить</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!employees || employees.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                Нет сотрудников. Нажмите «Добавить» чтобы создать.
              </p>
            ) : (
              <div className="space-y-2">
                {employees.map((emp) => (
                  <Link
                    key={emp.id}
                    href={`/crm/contacts/${emp.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {[emp.lastName, emp.firstName].filter(Boolean).join(" ") || "—"}
                      </p>
                      {emp.position && (
                        <p className="text-xs text-muted-foreground">{emp.position}</p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      {emp.phone && <p>{emp.phone}</p>}
                      {emp.email && <p>{emp.email}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Interactions section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Взаимодействия</CardTitle>
            <InteractionForm
              contactId={contactId}
              authorId={MOCK_AUTHOR_ID}
              onSuccess={handleInteractionSuccess}
            />
          </div>
        </CardHeader>
        <CardContent>
          <InteractionTimeline key={timelineKey} contactId={contactId} />
        </CardContent>
      </Card>

      {/* Edit modal */}
      <ContactFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        contact={contact}
        onSuccess={handleEditSuccess}
      />

      {/* Add employee modal — pre-fills companyId */}
      <ContactFormModal
        open={addEmployeeOpen}
        onOpenChange={setAddEmployeeOpen}
        defaultCompanyId={contactId}
        onSuccess={() => {
          setAddEmployeeOpen(false)
          fetchContact()
        }}
      />
    </div>
  )
}
