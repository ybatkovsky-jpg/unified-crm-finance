"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Edit2,
  Save,
  X,
  FileText,
  History,
  UserPlus,
  Link as LinkIcon,
  Calendar,
  DollarSign,
  Building2,
  FilePlus,
  Plus,
} from "lucide-react"
import { contractsApi, ApiClientError } from "@/lib/api/contracts"
import type { ContractData, ContractVersionData, ContractSignerData } from "@/lib/api/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [contract, setContract] = useState<ContractData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("details")
  const [editForm, setEditForm] = useState({
    title: "",
    amount: "",
    currency: "RUB",
    startDate: "",
    endDate: "",
    status: "draft",
    notes: "",
  })

  // Version modal state
  const [versionModalOpen, setVersionModalOpen] = useState(false)
  const [versionForm, setVersionForm] = useState({
    contentMd: "",
  })
  const [versionSaving, setVersionSaving] = useState(false)

  // Signer modal state
  const [signerModalOpen, setSignerModalOpen] = useState(false)
  const [signerForm, setSignerForm] = useState({
    name: "",
    position: "",
  })
  const [signerSaving, setSignerSaving] = useState(false)

  const unwrapParams = useCallback(async () => {
    return await params
  }, [params])

  const fetchContract = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await contractsApi.getContract(id)
      setContract(response.data)
      setEditForm({
        title: response.data.title,
        amount: response.data.amount.toString(),
        currency: response.data.currency,
        startDate: response.data.startDate
          ? new Date(response.data.startDate).toISOString().split('T')[0]
          : "",
        endDate: response.data.endDate
          ? new Date(response.data.endDate).toISOString().split('T')[0]
          : "",
        status: response.data.status,
        notes: response.data.notes || "",
      })
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Failed to load contract. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    unwrapParams().then(({ id }) => {
      fetchContract(id)
    })
  }, [unwrapParams, fetchContract])

  const handleSave = async () => {
    if (!contract) return

    setSaving(true)
    setError(null)

    try {
      const response = await contractsApi.updateContract(contract.id, {
        title: editForm.title,
        amount: parseFloat(editForm.amount) || 0,
        currency: editForm.currency,
        startDate: editForm.startDate || undefined,
        endDate: editForm.endDate || undefined,
        status: editForm.status,
        notes: editForm.notes || undefined,
      })

      setContract(response.data)
      setIsEditing(false)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Failed to save contract. Please try again.")
      }
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (contract) {
      setEditForm({
        title: contract.title,
        amount: contract.amount.toString(),
        currency: contract.currency,
        startDate: contract.startDate
          ? new Date(contract.startDate).toISOString().split('T')[0]
          : "",
        endDate: contract.endDate
          ? new Date(contract.endDate).toISOString().split('T')[0]
          : "",
        status: contract.status,
        notes: contract.notes || "",
      })
    }
    setIsEditing(false)
    setError(null)
  }

  const handleAddVersion = async () => {
    if (!contract || !versionForm.contentMd.trim()) return

    setVersionSaving(true)
    setError(null)

    try {
      const response = await contractsApi.addVersion(contract.id, {
        contentMd: versionForm.contentMd,
        createdBy: "current-user", // TODO: Get from auth context
      })

      // Refresh contract to get updated versions
      await fetchContract(contract.id)
      setVersionForm({ contentMd: "" })
      setVersionModalOpen(false)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Failed to add version. Please try again.")
      }
    } finally {
      setVersionSaving(false)
    }
  }

  const handleAddSigner = async () => {
    if (!contract || !signerForm.name.trim()) return

    setSignerSaving(true)
    setError(null)

    try {
      const response = await contractsApi.addSigner(contract.id, {
        name: signerForm.name,
        position: signerForm.position || undefined,
      })

      // Refresh contract to get updated signers
      await fetchContract(contract.id)
      setSignerForm({ name: "", position: "" })
      setSignerModalOpen(false)
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message)
      } else {
        setError("Failed to add signer. Please try again.")
      }
    } finally {
      setSignerSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading contract...</div>
        </div>
      </div>
    )
  }

  if (error && !contract) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-3 py-8">
              <p className="text-destructive">{error}</p>
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="size-4" />
                <span className="ml-1.5">Go Back</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!contract) return null

  const statusColors: Record<string, string> = {
    draft: "#94a3b8",
    active: "#22c55e",
    signed: "#3b82f6",
    expired: "#ef4444",
    cancelled: "#f97316",
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{contract.title}</h1>
              <Badge
                style={{
                  backgroundColor: statusColors[contract.status] || "#94a3b8",
                  color: "#fff",
                }}
              >
                {contract.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {contract.number}
            </p>
          </div>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit2 className="size-4" />
            <span className="ml-1.5">Изменить</span>
          </Button>
        )}
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Content with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="signers">Signers</TabsTrigger>
          <TabsTrigger value="related">Related</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Детали контракта</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="title">Название</Label>
                    <Input
                      id="title"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="amount">Сумма</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={editForm.amount}
                        onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="currency">Валюта</Label>
                      <Select
                        value={editForm.currency}
                        onValueChange={(value) => setEditForm({ ...editForm, currency: value ?? "RUB" })}
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="startDate">Дата начала</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={editForm.startDate}
                        onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="endDate">Дата окончания</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={editForm.endDate}
                        onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="status">Статус</Label>
                    <Select
                      value={editForm.status}
                      onValueChange={(value) => setEditForm({ ...editForm, status: value ?? "draft" })}
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Черновик</SelectItem>
                        <SelectItem value="active">Активный</SelectItem>
                        <SelectItem value="signed">Подписан</SelectItem>
                        <SelectItem value="expired">Истёк</SelectItem>
                        <SelectItem value="cancelled">Отменён</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="notes">Примечания</Label>
                    <Textarea
                      id="notes"
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSave} disabled={saving}>
                      <Save className="size-4" />
                      <span className="ml-1.5">{saving ? "Saving..." : "Save"}</span>
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="size-4" />
                      <span className="ml-1.5">Cancel</span>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Сумма</p>
                        <p className="font-medium">
                          {contract.amount.toLocaleString("ru-RU")} {contract.currency}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Начало</p>
                        <p className="font-medium">
                          {contract.startDate
                            ? new Date(contract.startDate).toLocaleDateString("ru-RU")
                            : "\u2014"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Окончание</p>
                        <p className="font-medium">
                          {contract.endDate
                            ? new Date(contract.endDate).toLocaleDateString("ru-RU")
                            : "\u2014"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <FileText className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Подписан</p>
                        <p className="font-medium">
                          {contract.signedAt
                            ? new Date(contract.signedAt).toLocaleDateString("ru-RU")
                            : "\u2014"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {contract.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Примечания</p>
                      <p className="text-sm">{contract.notes}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Метаданные</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Создан</span>
                <span>{new Date(contract.createdAt).toLocaleDateString("ru-RU")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Обновлён</span>
                <span>{new Date(contract.updatedAt).toLocaleDateString("ru-RU")}</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Versions Tab */}
        <TabsContent value="versions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Версии контракта</CardTitle>
                <Dialog open={versionModalOpen} onOpenChange={setVersionModalOpen}>
                  <DialogTrigger>
                    <Button size="sm">
                      <FilePlus className="size-4" />
                      <span className="ml-1.5">Добавить версию</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Новая версия</DialogTitle>
                      <DialogDescription>
                        Создайте новую версию контракта. Номер версии будет присвоен автоматически.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="contentMd">Содержание (Markdown)</Label>
                        <Textarea
                          id="contentMd"
                          value={versionForm.contentMd}
                          onChange={(e) => setVersionForm({ ...versionForm, contentMd: e.target.value })}
                          rows={10}
                          placeholder="Введите содержание контракта в формате Markdown..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setVersionModalOpen(false)}>
                        Отмена
                      </Button>
                      <Button onClick={handleAddVersion} disabled={versionSaving || !versionForm.contentMd.trim()}>
                        {versionSaving ? "Создание..." : "Создать"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {contract.versions && contract.versions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Версия</TableHead>
                      <TableHead>Создана</TableHead>
                      <TableHead>Автор</TableHead>
                      <TableHead>Файл PDF</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contract.versions.map((version: ContractVersionData) => (
                      <TableRow key={version.id}>
                        <TableCell className="font-medium">v{version.version}</TableCell>
                        <TableCell>
                          {new Date(version.createdAt).toLocaleDateString("ru-RU")}
                        </TableCell>
                        <TableCell>{version.createdBy}</TableCell>
                        <TableCell>
                          {version.generatedPdfFileId ? (
                            <Badge variant="outline">Есть</Badge>
                          ) : (
                            <span className="text-muted-foreground">\u2014</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Версии пока не созданы
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Signers Tab */}
        <TabsContent value="signers">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Подписанты</CardTitle>
                <Dialog open={signerModalOpen} onOpenChange={setSignerModalOpen}>
                  <DialogTrigger>
                    <Button size="sm">
                      <UserPlus className="size-4" />
                      <span className="ml-1.5">Добавить подписанта</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Новый подписант</DialogTitle>
                      <DialogDescription>
                        Добавьте подписанта для этого контракта.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="signerName">Имя</Label>
                        <Input
                          id="signerName"
                          value={signerForm.name}
                          onChange={(e) => setSignerForm({ ...signerForm, name: e.target.value })}
                          placeholder="Иван Иванов"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="signerPosition">Должность (опционально)</Label>
                        <Input
                          id="signerPosition"
                          value={signerForm.position}
                          onChange={(e) => setSignerForm({ ...signerForm, position: e.target.value })}
                          placeholder="Генеральный директор"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setSignerModalOpen(false)}>
                        Отмена
                      </Button>
                      <Button onClick={handleAddSigner} disabled={signerSaving || !signerForm.name.trim()}>
                        {signerSaving ? "Добавление..." : "Добавить"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {contract.signers && contract.signers.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Имя</TableHead>
                      <TableHead>Должность</TableHead>
                      <TableHead>Подписано</TableHead>
                      <TableHead>Подпись</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contract.signers.map((signer: ContractSignerData) => (
                      <TableRow key={signer.id}>
                        <TableCell className="font-medium">{signer.name}</TableCell>
                        <TableCell>{signer.position ?? "\u2014"}</TableCell>
                        <TableCell>
                          {signer.signedAt
                            ? new Date(signer.signedAt).toLocaleDateString("ru-RU")
                            : "\u2014"}
                        </TableCell>
                        <TableCell>
                          {signer.signatureFileId ? (
                            <Badge variant="outline">Есть</Badge>
                          ) : (
                            <span className="text-muted-foreground">\u2014</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Подписанты пока не добавлены
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Related Tab */}
        <TabsContent value="related">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="size-4" />
                Связанные сущности
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Building2 className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Контакт</p>
                  {contract.contact ? (
                    <a
                      href={`/crm/contacts/${contract.contact.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {contract.contact.type === "company"
                        ? contract.contact.companyName
                        : [contract.contact.lastName, contract.contact.firstName]
                            .filter(Boolean)
                            .join(" ")}
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">\u2014</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <DollarSign className="size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Сделка</p>
                  {contract.deal ? (
                    <a
                      href={`/deals/${contract.deal.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {contract.deal.title}
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground">\u2014</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
