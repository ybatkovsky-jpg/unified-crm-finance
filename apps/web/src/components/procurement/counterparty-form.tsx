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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CounterpartyFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CounterpartyForm({ open, onOpenChange, onSuccess }: CounterpartyFormProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState("")
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
        setFormError("Failed to create counterparty. Please try again.")
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
          <DialogTitle>Create Counterparty</DialogTitle>
          <DialogDescription>
            Add a new supplier or customer to the system.
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
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Counterparty name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">
                  Type <span className="text-destructive">*</span>
                </Label>
                <Select value={type} onValueChange={(value) => { if (value) setType(value) }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="supplier">Supplier</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* INN and KPP */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="inn">INN</Label>
                <Input
                  id="inn"
                  value={inn}
                  onChange={(e) => setInn(e.target.value)}
                  placeholder="Tax ID"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="kpp">KPP</Label>
                <Input
                  id="kpp"
                  value={kpp}
                  onChange={(e) => setKpp(e.target.value)}
                  placeholder="KPP"
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
                  placeholder="Email address"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                />
              </div>
            </div>

            {/* Contact Person */}
            <div className="grid gap-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Contact person name"
              />
            </div>

            {/* Address */}
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Legal address"
              />
            </div>

            {/* Bank Details */}
            <div className="rounded-lg border p-4 space-y-4">
              <h4 className="text-sm font-medium">Bank Details</h4>
              <div className="grid gap-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Bank name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bankAccount">Bank Account</Label>
                  <Input
                    id="bankAccount"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="Account number"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="korAccount">Corr. Account</Label>
                  <Input
                    id="korAccount"
                    value={korAccount}
                    onChange={(e) => setKorAccount(e.target.value)}
                    placeholder="Correspondent account"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="bik">BIK</Label>
                <Input
                  id="bik"
                  value={bik}
                  onChange={(e) => setBik(e.target.value)}
                  placeholder="BIK"
                />
              </div>
            </div>

            {/* Rating */}
            <div className="grid gap-2">
              <Label htmlFor="rating">Rating</Label>
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
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes"
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
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
