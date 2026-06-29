"use client"

import { useState, useEffect } from "react"
import { Plus, X, Search, User, Building2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { dealsApi, ApiClientError } from "@/lib/api/deals"
import { contactsApi } from "@/lib/api/contacts"
import { getLeadSources } from "@/lib/api/lead-source"
import type { DealCreateInput, ContactData, LeadSourceData } from "@/lib/api/types"

function getContactDisplayName(contact: ContactData): string {
  if (contact.type === "person") {
    const parts = [contact.firstName, contact.lastName].filter(Boolean)
    return parts.length > 0 ? parts.join(" ") : contact.id
  }
  return contact.companyName || contact.id
}

interface CreateDealModalProps {
  pipelineId: string
  firstStageId: string
  onCreate?: (deal: any) => void
}

export function CreateDealModal({
  pipelineId,
  firstStageId,
  onCreate,
}: CreateDealModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("RUB")
  const [expectedCloseDate, setExpectedCloseDate] = useState("")
  const [description, setDescription] = useState("")
  const [contacts, setContacts] = useState<ContactData[]>([])
  const [contactSearch, setContactSearch] = useState("")
  const [selectedContact, setSelectedContact] = useState<ContactData | null>(null)
  const [leadSources, setLeadSources] = useState<LeadSourceData[]>([])
  const [sourceId, setSourceId] = useState("")

  // Fetch contacts when modal opens
  useEffect(() => {
    if (open) {
      contactsApi
        .getContacts({})
        .then((res) => setContacts(res.data.slice(0, 50)))
        .catch((err) => console.error("Failed to fetch contacts:", err))
      getLeadSources()
        .then((res) => setLeadSources(res.data))
        .catch((err) => console.error("Failed to fetch lead sources:", err))
    }
  }, [open])

  const filteredContacts = contacts.filter((c) =>
    getContactDisplayName(c).toLowerCase().includes(contactSearch.toLowerCase())
  )

  const resetContactSelection = () => {
    setSelectedContact(null)
    setContactSearch("")
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      resetContactSelection()
      setSourceId("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const data: DealCreateInput = {
        title,
        pipelineId,
        stageId: firstStageId,
        contactId: selectedContact?.id || undefined,
        sourceId: sourceId || undefined,
        amount: amount ? parseFloat(amount) : 0,
        currency,
        expectedCloseDate: expectedCloseDate || undefined,
        description: description || undefined,
      }

      const response = await dealsApi.createDeal(data)
      onCreate?.(response.data)
      setOpen(false)

      // Reset form
      setTitle("")
      setAmount("")
      setCurrency("RUB")
      setExpectedCloseDate("")
      setDescription("")
      resetContactSelection()
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Failed to create deal. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        <span className="ml-1.5">Создать сделку</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Новая сделка</DialogTitle>
            <DialogDescription>
              Создайте новую сделку в воронке продаж.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                {error}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="title">Название *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например: Поставка оборудования для ООО Ромашка"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">Сумма</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="currency">Валюта</Label>
                <Select value={currency} onValueChange={(value) => setCurrency(value ?? "RUB")}>
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RUB">RUB</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expectedCloseDate">Ожидаемая дата закрытия</Label>
              <Input
                id="expectedCloseDate"
                type="date"
                value={expectedCloseDate}
                onChange={(e) => setExpectedCloseDate(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Дополнительная информация о сделке..."
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label>Контакт</Label>
              {selectedContact ? (
                <div className="flex items-center gap-2 p-2 border rounded-md">
                  {selectedContact.type === "person" ? (
                    <User className="size-4 text-muted-foreground shrink-0" />
                  ) : (
                    <Building2 className="size-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-sm flex-1 truncate">
                    {getContactDisplayName(selectedContact)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => resetContactSelection()}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Поиск контакта..."
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto border rounded-md">
                    {filteredContacts.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-2 text-center">
                        {contacts.length === 0
                          ? "Загрузка..."
                          : "Контакты не найдены"}
                      </p>
                    ) : (
                      filteredContacts.map((contact) => (
                        <button
                          key={contact.id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 text-sm border-b last:border-b-0"
                          onClick={() => {
                            setSelectedContact(contact)
                            setContactSearch("")
                          }}
                        >
                          {contact.type === "person" ? (
                            <User className="size-3 text-muted-foreground shrink-0" />
                          ) : (
                            <Building2 className="size-3 text-muted-foreground shrink-0" />
                          )}
                          <span className="flex-1 truncate">
                            {getContactDisplayName(contact)}
                          </span>
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {contact.type === "person" ? "Физ" : "Юр"}
                          </Badge>
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="source">Источник</Label>
              <Select value={sourceId} onValueChange={(value) => setSourceId(value ?? "")}>
                <SelectTrigger id="source">
                  <SelectValue placeholder="Выберите источник..." />
                </SelectTrigger>
                <SelectContent>
                  {leadSources.map((ls) => (
                    <SelectItem key={ls.id} value={ls.id}>
                      {ls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
