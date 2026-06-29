"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { RefreshCwIcon } from "lucide-react"

import { contractsApi, ApiClientError } from "@/lib/api/contracts"
import { contactsApi } from "@/lib/api/contacts"
import type { ContractData, ContactData } from "@/lib/api/types"
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

type StatusFilter = "all" | "draft" | "active" | "expired" | "terminated"

function formatCurrency(amount: number, currency: string = "RUB"): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: currency,
  }).format(amount)
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "\u2014"
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("ru-RU")
}

function getStatusVariant(status: string): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "active":
      return "default"
    case "draft":
      return "outline"
    case "expired":
      return "destructive"
    case "terminated":
      return "destructive"
    default:
      return "outline"
  }
}

function getContactName(contract: ContractData): string {
  if (!contract.contact) return "\u2014"
  if (contract.contact.type === "company") {
    return contract.contact.companyName || "\u2014"
  }
  return [contract.contact.lastName, contract.contact.firstName]
    .filter(Boolean)
    .join(" ") || "\u2014"
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<ContractData[]>([])
  const [contacts, setContacts] = useState<ContactData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [contactFilter, setContactFilter] = useState<string>("all")

  const fetchContacts = useCallback(async () => {
    try {
      const response = await contactsApi.getContacts()
      console.log(`[Contracts] Fetched ${response.data.length} contacts`)
      setContacts(response.data)
    } catch (err) {
      console.error("[Contracts] Failed to fetch contacts:", err)
    }
  }, [])

  const fetchContracts = useCallback(async (status: StatusFilter, contactId: string) => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string> = {}
      if (status !== "all") params.status = status
      if (contactId !== "all") params.contactId = contactId

      const startTime = performance.now()
      const response = await contractsApi.getContracts(
        Object.keys(params).length > 0 ? params : undefined
      )
      const duration = performance.now() - startTime

      console.log(`[Contracts] Fetched ${response.data.length} contracts in ${duration.toFixed(2)}ms`)

      setContracts(response.data)
    } catch (err) {
      if (err instanceof ApiClientError) {
        console.error("[Contracts] API error:", err.message)
        setError(err.message)
      } else {
        console.error("[Contracts] Unexpected error:", err)
        setError("Не удалось загрузить договорs. Попробуйте снова.")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  useEffect(() => {
    fetchContracts(statusFilter, contactFilter)
  }, [statusFilter, contactFilter, fetchContracts])

  const handleRetry = () => {
    fetchContracts(statusFilter, contactFilter)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Контракты</h1>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">Статус</label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  if (value) setStatusFilter(value as StatusFilter)
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="draft">Черновик</SelectItem>
                    <SelectItem value="active">Действует</SelectItem>
                    <SelectItem value="expired">Истёк</SelectItem>
                    <SelectItem value="terminated">Расторгнут</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">Контрагент</label>
              <Select
                value={contactFilter}
                onValueChange={(value) => {
                  if (value) setContactFilter(value)
                }}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Все контрагенты" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Все контрагенты</SelectItem>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.type === "company"
                          ? contact.companyName || `Компания ${contact.id}`
                          : [contact.lastName, contact.firstName]
                              .filter(Boolean)
                              .join(" ") || `Контакт ${contact.id}`
                        }
                      </SelectItem>
                    ))}
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
          <span className="ml-2 text-muted-foreground">Загрузка договораs...</span>
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

      {!loading && !error && contracts.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">
              Нет договоров found
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && contracts.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Номер</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Контрагент</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Дата начала</TableHead>
                <TableHead>Дата окончания</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-mono text-xs">
                    <Link
                      href={`/contracts/${contract.id}`}
                      className="text-primary hover:underline"
                    >
                      {contract.number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/contracts/${contract.id}`}
                      className="text-primary hover:underline font-medium"
                    >
                      {contract.title}
                    </Link>
                  </TableCell>
                  <TableCell>{getContactName(contract)}</TableCell>
                  <TableCell>{formatCurrency(Number(contract.amount), contract.currency)}</TableCell>
                  <TableCell>{formatDate(contract.startDate)}</TableCell>
                  <TableCell>{formatDate(contract.endDate)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(contract.status)}>
                      {contract.status}
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
