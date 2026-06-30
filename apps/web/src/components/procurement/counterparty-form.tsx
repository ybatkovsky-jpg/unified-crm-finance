"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"

import { counterpartiesApi, ApiClientError } from "@/lib/api/counterparties"
import type { CounterpartyCreateInput } from "@/lib/api/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const PRODUCTION_SKILLS = [
  { value: "plate", label: "ДСП/МДФ" },
  { value: "stone", label: "Камень" },
  { value: "glass", label: "Стекло" },
  { value: "concrete", label: "Бетон" },
  { value: "paint", label: "Покраска/плёнка" },
  { value: "universal", label: "Универсал" },
]

interface CounterpartyFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CounterpartyForm({ open, onOpenChange, onSuccess }: CounterpartyFormProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState("")
  const [skillTags, setSkillTags] = useState<string[]>([])
  const [inn, setInn] = useState("")
  const [kpp, setKpp] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [contactPerson, setContactPerson] = useState("")
  const [address, setAddress] = useState("")
  const [bankName, setBankName] = useState("")
  const [bankAccount, setBankAccount] = useState("")
  const [korAccount, setKorAccount] = useState("")
  const [bik, setBik] = useState("")
  const [notes, setNotes] = useState("")
  const [rating, setRating] = useState<number>(0)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const resetForm = () => {
    setName("")
    setType("")
    setSkillTags([])
    setInn("")
    setKpp("")
    setEmail("")
    setPhone("")
    setContactPerson("")
    setAddress("")
    setBankName("")
    setBankAccount("")
    setKorAccount("")
    setBik("")
    setNotes("")
    setRating(0)
    setFormError(null)
  }

  const toggleSkillTag = (tag: string) => {
    setSkillTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!name.trim()) {
      setFormError("Name is required")
      return
    }
    if (!type) {
      setFormError("Type is required")
      return
    }

    setSubmitting(true)
    try {
      const input: CounterpartyCreateInput = {
        name: name.trim(),
        type,
        types: skillTags.length > 0 ? skillTags : null,
        inn: inn.trim() || null,
        kpp: kpp.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        contactPerson: contactPerson.trim() || null,
        address: address.trim() || null,
        bankName: bankName.trim() || null,
        bankAccount: bankAccount.trim() || null,
        korAccount: korAccount.trim() || null,
        bik: bik.trim() || null,
        notes: notes.trim() || null,
        rating: rating > 0 ? rating : null,
      }
      await counterpartiesApi.createCounterparty(input)
      resetForm()
      onSuccess()
    } catch (err) {
      if (err instanceof ApiClientError) {
        setFormError(err.message)
      } else {
        setFormError("Не удалось создать контрагента. Пожалуйста, попробуйте снова.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Новый контрагент</DialogTitle>
          <DialogDescription>
            Добавьте поставщика или заказчика в систему.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {formError && (
            <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          <div className="grid gap-4 py-2">
            {/* Name and Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Название <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Название контрагента"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">
                  Тип <span className="text-destructive">*</span>
                </Label>
                <Select value={type} onValueChange={(value) => { if (value) setType(value) }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="supplier">Поставщик</SelectItem>
                      <SelectItem value="customer">Заказчик</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Production Skill Tags (for suppliers) */}
            {type === "supplier" && (
              <div className="grid gap-2">
                <Label>Навыки производства</Label>
                <div className="flex flex-wrap gap-2">
                  {PRODUCTION_SKILLS.map(skill => (
                    <Badge
                      key={skill.value}
                      variant={skillTags.includes(skill.value) ? "default" : "outline"}
                      className="cursor-pointer select-none"
                      onClick={() => toggleSkillTag(skill.value)}
                    >
                      {skill.label}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Выберите виды материалов, с которыми работает партнёр
                </p>
              </div>
            )}

            {/* INN and KPP */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="inn">ИНН</Label>
                <Input
                  id="inn"
                  value={inn}
                  onChange={(e) => setInn(e.target.value)}
                  placeholder="ИНН"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="kpp">КПП</Label>
                <Input
                  id="kpp"
                  value={kpp}
                  onChange={(e) => setKpp(e.target.value)}
                  placeholder="КПП"
                />
              </div>
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Телефон"
                />
              </div>
            </div>

            {/* Contact Person */}
            <div className="grid gap-2">
              <Label htmlFor="contactPerson">Контактное лицо</Label>
              <Input
                id="contactPerson"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Имя контактного лица"
              />
            </div>

            {/* Address */}
            <div className="grid gap-2">
              <Label htmlFor="address">Адрес</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Юридический адрес"
              />
            </div>

            {/* Bank Details */}
            <div className="rounded-lg border p-4 space-y-4">
              <h4 className="text-sm font-medium">Банковские реквизиты</h4>
              <div className="grid gap-2">
                <Label htmlFor="bankName">Банк</Label>
                <Input
                  id="bankName"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Название банка"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bankAccount">Расчётный счёт</Label>
                  <Input
                    id="bankAccount"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="Номер счёта"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="korAccount">Корр. счёт</Label>
                  <Input
                    id="korAccount"
                    value={korAccount}
                    onChange={(e) => setKorAccount(e.target.value)}
                    placeholder="Корреспондентский счёт"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bik">БИК</Label>
                <Input
                  id="bik"
                  value={bik}
                  onChange={(e) => setBik(e.target.value)}
                  placeholder="БИК"
                />
              </div>
            </div>

            {/* Rating */}
            <div className="grid gap-2">
              <Label htmlFor="rating">Рейтинг (1-5)</Label>
              <Input
                id="rating"
                type="number"
                min={1}
                max={5}
                value={rating || ""}
                onChange={(e) => setRating(e.target.value ? parseInt(e.target.value) : 0)}
                placeholder="1-5"
              />
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Заметки</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Дополнительные заметки"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
