"use client"

import { useState, useEffect } from "react"
import { Plus, X, Search, User, Building2, MapPin, Trash2 } from "lucide-react"
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
import { ContactFormModal } from "@/components/contacts/contact-form-modal"

function getContactDisplayName(contact: ContactData): string {
  if (contact.type === "person") {
    const parts = [contact.firstName, contact.lastName].filter(Boolean)
    return parts.length > 0 ? parts.join(" ") : contact.id
  }
  return contact.companyName || contact.id
}

type ContactRole = "customer" | "designer" | "installer" | "other"

const ROLE_LABELS: Record<ContactRole, string> = {
  customer: "Заказчик",
  designer: "Дизайнер",
  installer: "Монтажник",
  other: "Другое",
}

interface SelectedContact {
  contact: ContactData
  role: ContactRole
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
  const [objectAddress, setObjectAddress] = useState("")
  const [contacts, setContacts] = useState<ContactData[]>([])
  const [leadSources, setLeadSources] = useState<LeadSourceData[]>([])
  const [sourceId, setSourceId] = useState("")

  // Multi-contact selection with roles
  const [selectedContacts, setSelectedContacts] = useState<SelectedContact[]>([])
  const [showContactPicker, setShowContactPicker] = useState(false)
  const [contactSearch, setContactSearch] = useState("")
  const [pickerRole, setPickerRole] = useState<ContactRole>("customer")
  const [createContactOpen, setCreateContactOpen] = useState(false)

  useEffect(() => {
    if (open) {
      contactsApi
        .getContacts({})
        .then((res) => setContacts(res.data.slice(0, 100)))
        .catch((err) => console.error("Failed to fetch contacts:", err))
      getLeadSources()
        .then((res) => setLeadSources(res.data))
        .catch((err) => console.error("Failed to fetch lead sources:", err))
    }
  }, [open])

  const filteredContacts = contacts.filter((c) => {
    const name = getContactDisplayName(c).toLowerCase()
    return name.includes(contactSearch.toLowerCase())
  })

  const handleAddContact = (contact: ContactData, role: ContactRole) => {
    const exists = selectedContacts.some(
      (sc) => sc.contact.id === contact.id && sc.role === role
    )
    if (!exists) {
      setSelectedContacts([...selectedContacts, { contact, role }])
    }
    setShowContactPicker(false)
    setContactSearch("")
  }

  const handleRemoveContact = (index: number) => {
    setSelectedContacts(selectedContacts.filter((_, i) => i !== index))
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setSelectedContacts([])
      setShowContactPicker(false)
      setContactSearch("")
      setSourceId("")
    }
  }

  const refreshContacts = () => {
    contactsApi.getContacts({}).then((res) => setContacts(res.data.slice(0, 100)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const primaryContact = selectedContacts.find((sc) => sc.role === "customer")?.contact
        ?? selectedContacts[0]?.contact

      const data: DealCreateInput = {
        title,
        pipelineId,
        stageId: firstStageId,
        contactId: primaryContact?.id || undefined,
        sourceId: sourceId || undefined,
        amount: amount ? parseFloat(amount) : 0,
        currency,
        expectedCloseDate: expectedCloseDate || undefined,
        description: description || undefined,
        objectAddress: objectAddress || undefined,
      } as DealCreateInput

      const response = await dealsApi.createDeal(data)

      // Add all contacts to the deal via the deal-contacts API
      if (selectedContacts.length > 0 && response.data?.id) {
        const dealId = response.data.id
        await Promise.all(
          selectedContacts.map((sc) =>
            fetch(`/api/deals/${dealId}/contacts`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ contactId: sc.contact.id, role: sc.role }),
            }).catch((err) => console.error("Failed to add deal contact:", err))
          )
        )
      }

      onCreate?.(response.data)
      setOpen(false)

      setTitle("")
      setAmount("")
      setCurrency("RUB")
      setExpectedCloseDate("")
      setDescription("")
      setObjectAddress("")
      setSelectedContacts([])
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Не удалось создать сделку. Попробуйте снова.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger render={<Button />}>
          <Plus className="size-4" />
          <span className="ml-1.5">Создать сделку</span>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
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
                  placeholder="Например: Кухня для ООО Ромашка"
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
                  <Select
                    value={currency}
                    onValueChange={(value) => setCurrency(value ?? "RUB")}
                    items={{ RUB: "RUB", USD: "USD", EUR: "EUR" }}
                  >
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
                <Label htmlFor="objectAddress">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    Адрес объекта
                  </span>
                </Label>
                <Input
                  id="objectAddress"
                  value={objectAddress}
                  onChange={(e) => setObjectAddress(e.target.value)}
                  placeholder="г. Москва, ул. Ленина, д. 1, кв. 1"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Дополнительная информация о сделке..."
                  rows={2}
                />
              </div>

              {/* Multi-contact section */}
              <div className="grid gap-2">
                <Label>Контактные лица</Label>
                {selectedContacts.length > 0 && (
                  <div className="space-y-1.5">
                    {selectedContacts.map((sc, i) => (
                      <div key={`${sc.contact.id}-${sc.role}`} className="flex items-center gap-2 p-2 border rounded-md">
                        {sc.contact.type === "person" ? (
                          <User className="size-4 text-muted-foreground shrink-0" />
                        ) : (
                          <Building2 className="size-4 text-muted-foreground shrink-0" />
                        )}
                        <span className="text-sm flex-1 truncate">
                          {getContactDisplayName(sc.contact)}
                        </span>
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {ROLE_LABELS[sc.role]}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-6 shrink-0"
                          onClick={() => handleRemoveContact(i)}
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {showContactPicker ? (
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
                        {(Object.keys(ROLE_LABELS) as ContactRole[]).map((r) => (
                          <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                      <Input
                        placeholder="Поиск контакта..."
                        value={contactSearch}
                        onChange={(e) => setContactSearch(e.target.value)}
                        className="pl-8 h-8"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-32 overflow-y-auto border rounded-md">
                      {filteredContacts.length === 0 ? (
                        <div className="p-2 text-center">
                          <p className="text-sm text-muted-foreground mb-1">Не найдено</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setCreateContactOpen(true)}
                          >
                            <Plus className="size-3" />
                            <span className="ml-1">Создать контакт</span>
                          </Button>
                        </div>
                      ) : (
                        filteredContacts.map((contact) => (
                          <button
                            key={contact.id}
                            type="button"
                            className="w-full text-left px-3 py-1.5 hover:bg-muted flex items-center gap-2 text-sm border-b last:border-b-0"
                            onClick={() => handleAddContact(contact, pickerRole)}
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowContactPicker(true)}
                  >
                    <Plus className="size-3.5" />
                    <span className="ml-1">Добавить контакт</span>
                  </Button>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="source">Источник</Label>
                <Select
                  value={sourceId}
                  onValueChange={(value) => setSourceId(value ?? "")}
                  items={Object.fromEntries(leadSources.map((ls) => [ls.id, ls.name]))}
                >
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

      {/* Inline contact creation */}
      <ContactFormModal
        open={createContactOpen}
        onOpenChange={setCreateContactOpen}
        onSuccess={() => {
          refreshContacts()
        }}
      />
    </>
  )
}
