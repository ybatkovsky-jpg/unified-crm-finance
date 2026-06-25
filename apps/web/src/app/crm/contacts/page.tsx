"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { RefreshCwIcon } from "lucide-react"

import { contactsApi, ApiClientError } from "@/lib/api/contacts"
import type { ContactData } from "@/lib/api/types"
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

type TypeFilter = "all" | "person" | "company"
type StatusFilter = "all" | "active" | "inactive"

function getDisplayName(contact: ContactData): string {
  if (contact.type === "company") {
    return contact.companyName || "\u2014"
  }
  return [contact.lastName, contact.firstName].filter(Boolean).join(" ") || "\u2014"
}

export default function ContactListPage() {
  const [contacts, setContacts] = useState<ContactData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

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
        setError("Не удалось загрузить контактs. Попробуйте снова.")
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Contacts</h1>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">Type</label>
              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  if (value) setTypeFilter(value as TypeFilter)
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="person">Person</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">Status</label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  if (value) setStatusFilter(value as StatusFilter)
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
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
          <span className="ml-2 text-muted-foreground">Загрузка контактаs...</span>
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
              No contacts found
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && contacts.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
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
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        contact.type === "company" ? "secondary" : "default"
                      }
                    >
                      {contact.type === "company" ? "Company" : "Person"}
                    </Badge>
                  </TableCell>
                  <TableCell>{contact.phone || "\u2014"}</TableCell>
                  <TableCell>{contact.email || "\u2014"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        contact.status === "active" ? "default" : "outline"
                      }
                    >
                      {contact.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
