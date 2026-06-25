"use client"

import { useState, useEffect } from "react"
import { Plus, X, Search, User, Building2, FileText, Briefcase } from "lucide-react"
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
import { projectsApi, ApiClientError } from "@/lib/api/projects"
import { contactsApi } from "@/lib/api/contacts"
import { contractsApi } from "@/lib/api/contracts"
import { dealsApi } from "@/lib/api/deals"
import type { ProjectCreateInput, ContactData, ContractData, DealData } from "@/lib/api/types"

function getContactDisplayName(contact: ContactData): string {
  if (contact.type === "person") {
    const parts = [contact.firstName, contact.lastName].filter(Boolean)
    return parts.length > 0 ? parts.join(" ") : contact.id
  }
  return contact.companyName || contact.id
}

interface CreateProjectModalProps {
  onCreate?: (project: any) => void
}

const STATUS_OPTIONS = [
  { value: "lead", label: "Лид" },
  { value: "active", label: "Активный" },
  { value: "completed", label: "Завершён" },
  { value: "paused", label: "На паузе" },
]

const CURRENCY_OPTIONS = [
  { value: "RUB", label: "RUB" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
]

// MVP: hardcoded manager list
const MANAGER_OPTIONS = [
  { value: "1", label: "Admin" },
]

export function CreateProjectModal({ onCreate }: CreateProjectModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form fields
  const [externalNumber, setExternalNumber] = useState("")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("lead")
  const [currency, setCurrency] = useState("RUB")
  const [contractAmount, setContractAmount] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [marginTarget, setMarginTarget] = useState("0.25")
  const [managerId, setManagerId] = useState("1")

  // Searchable dropdowns data
  const [contacts, setContacts] = useState<ContactData[]>([])
  const [contracts, setContracts] = useState<ContractData[]>([])
  const [deals, setDeals] = useState<DealData[]>([])

  // Search states
  const [contactSearch, setContactSearch] = useState("")
  const [contractSearch, setContractSearch] = useState("")
  const [dealSearch, setDealSearch] = useState("")

  // Selected items
  const [selectedContact, setSelectedContact] = useState<ContactData | null>(null)
  const [selectedContract, setSelectedContract] = useState<ContractData | null>(null)
  const [selectedDeal, setSelectedDeal] = useState<DealData | null>(null)

  // Fetch dropdown data when modal opens
  useEffect(() => {
    if (open) {
      Promise.all([
        contactsApi.getContacts({}).then((res) => setContacts(res.data.slice(0, 50))),
        contractsApi.getContracts({}).then((res) => setContracts(res.data.slice(0, 50))),
        dealsApi.getDeals({}).then((res) => setDeals(res.data.slice(0, 50))),
      ]).catch((err) => console.error("Failed to fetch dropdown data:", err))
    }
  }, [open])

  const filteredContacts = contacts.filter((c) =>
    getContactDisplayName(c).toLowerCase().includes(contactSearch.toLowerCase())
  )

  const filteredContracts = contracts.filter((c) =>
    c.title.toLowerCase().includes(contractSearch.toLowerCase())
  )

  const filteredDeals = deals.filter((d) =>
    d.title.toLowerCase().includes(dealSearch.toLowerCase())
  )

  const resetForm = () => {
    setExternalNumber("")
    setName("")
    setDescription("")
    setStatus("lead")
    setCurrency("RUB")
    setContractAmount("")
    setStartDate("")
    setEndDate("")
    setMarginTarget("0.25")
    setManagerId("1")
    setSelectedContact(null)
    setSelectedContract(null)
    setSelectedDeal(null)
    setContactSearch("")
    setContractSearch("")
    setDealSearch("")
    setError(null)
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      resetForm()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const data: ProjectCreateInput = {
        externalNumber,
        name,
        description: description || undefined,
        contactId: selectedContact?.id || undefined,
        dealId: selectedDeal?.id || undefined,
        contractId: selectedContract?.id || undefined,
        managerId: managerId || undefined,
        status,
        currency,
        contractAmount: contractAmount ? parseFloat(contractAmount) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        marginTarget: marginTarget ? parseFloat(marginTarget) : undefined,
      }

      const response = await projectsApi.createProject(data)
      onCreate?.(response.data)
      setOpen(false)
      resetForm()
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Failed to create project. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const isFormValid = externalNumber.trim() !== "" && name.trim() !== ""

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus className="size-4" />
        <span className="ml-1.5">Создать проект</span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Новый проект</DialogTitle>
            <DialogDescription>
              Создайте новый проект с привязкой к контакту, сделке или договору.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                {error}
              </div>
            )}

            {/* External Number */}
            <div className="grid gap-2">
              <Label htmlFor="externalNumber">Номер проекта *</Label>
              <Input
                id="externalNumber"
                value={externalNumber}
                onChange={(e) => setExternalNumber(e.target.value)}
                placeholder="ПМ-2026-00001"
                required
              />
            </div>

            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Название *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Разработка CRM системы"
                required
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Дополнительная информация о проекте..."
                rows={3}
              />
            </div>

            {/* Status & Manager */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status">Статус</Label>
                <Select value={status} onValueChange={(value) => setStatus(value ?? "lead")}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="managerId">Менеджер</Label>
                <Select value={managerId} onValueChange={(value) => setManagerId(value ?? "1")}>
                  <SelectTrigger id="managerId">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MANAGER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Currency & Contract Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="currency">Валюта</Label>
                <Select value={currency} onValueChange={(value) => setCurrency(value ?? "RUB")}>
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contractAmount">Сумма контракта</Label>
                <Input
                  id="contractAmount"
                  type="number"
                  value={contractAmount}
                  onChange={(e) => setContractAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Дата начала</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endDate">Дата окончания</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Margin Target */}
            <div className="grid gap-2">
              <Label htmlFor="marginTarget">Целевая маржа</Label>
              <Input
                id="marginTarget"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={marginTarget}
                onChange={(e) => setMarginTarget(e.target.value)}
                placeholder="0.25"
              />
            </div>

            {/* Contact Search */}
            <div className="grid gap-2">
              <Label>Контракт / Контрагент</Label>
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
                    onClick={() => {
                      setSelectedContact(null)
                      setContactSearch("")
                    }}
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
                  <div className="max-h-32 overflow-y-auto border rounded-md">
                    {filteredContacts.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-2 text-center">
                        {contacts.length === 0 ? "Загрузка..." : "Контакты не найдены"}
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

            {/* Deal Search */}
            <div className="grid gap-2">
              <Label>Сделка</Label>
              {selectedDeal ? (
                <div className="flex items-center gap-2 p-2 border rounded-md">
                  <Briefcase className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-sm flex-1 truncate">{selectedDeal.title}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => {
                      setSelectedDeal(null)
                      setDealSearch("")
                    }}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Поиск сделки..."
                      value={dealSearch}
                      onChange={(e) => setDealSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <div className="max-h-32 overflow-y-auto border rounded-md">
                    {filteredDeals.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-2 text-center">
                        {deals.length === 0 ? "Загрузка..." : "Сделки не найдены"}
                      </p>
                    ) : (
                      filteredDeals.map((deal) => (
                        <button
                          key={deal.id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 text-sm border-b last:border-b-0"
                          onClick={() => {
                            setSelectedDeal(deal)
                            setDealSearch("")
                          }}
                        >
                          <Briefcase className="size-3 text-muted-foreground shrink-0" />
                          <span className="flex-1 truncate">{deal.title}</span>
                          {deal.amount && (
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              {deal.currency} {deal.amount}
                            </Badge>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Contract Search */}
            <div className="grid gap-2">
              <Label>Договор</Label>
              {selectedContract ? (
                <div className="flex items-center gap-2 p-2 border rounded-md">
                  <FileText className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-sm flex-1 truncate">{selectedContract.title}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => {
                      setSelectedContract(null)
                      setContractSearch("")
                    }}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Поиск договора..."
                      value={contractSearch}
                      onChange={(e) => setContractSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <div className="max-h-32 overflow-y-auto border rounded-md">
                    {filteredContracts.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-2 text-center">
                        {contracts.length === 0 ? "Загрузка..." : "Договоры не найдены"}
                      </p>
                    ) : (
                      filteredContracts.map((contract) => (
                        <button
                          key={contract.id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 text-sm border-b last:border-b-0"
                          onClick={() => {
                            setSelectedContract(contract)
                            setContractSearch("")
                          }}
                        >
                          <FileText className="size-3 text-muted-foreground shrink-0" />
                          <span className="flex-1 truncate">{contract.title}</span>
                          {contract.amount && (
                            <Badge variant="outline" className="text-[10px] shrink-0">
                              {contract.currency} {contract.amount}
                            </Badge>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
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
            <Button type="submit" disabled={loading || !isFormValid}>
              {loading ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
