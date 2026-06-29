"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Package,
  Upload,
  Lock,
  Unlock,
  Plus,
  Trash2,
  FileSpreadsheet,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react"
import { bomApi, ApiClientError } from "@/lib/api/bom"
import { counterpartiesApi } from "@/lib/api/counterparties"
import type { BOMData, BOMItemData, BOMItemCreateInput, BOMItemUpdateInput, CounterpartyData } from "@/lib/api/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ParsedExcelRow {
  rowNumber: number
  name: string
  article?: string
  category?: string
  quantity: number
  unit?: string
  price?: number
  notes?: string
}

interface EditableCell {
  itemId: string
  field: "name" | "quantity" | "unit" | "price" | "article" | "category"
}

type BOMSectionState =
  | { kind: "loading" }
  | { kind: "no-bom" }
  | { kind: "uploading-excel"; rows: ParsedExcelRow[] }
  | { kind: "creating-bom" }
  | { kind: "has-bom"; bom: BOMData; items: BOMItemData[] }
  | { kind: "error"; message: string }

// ---------------------------------------------------------------------------
// Column mapping helpers
// ---------------------------------------------------------------------------

const COLUMN_PATTERNS: Record<string, string[]> = {
  name: ["наименование", "name", "название", "позиция", "товар", "product"],
  article: ["артикул", "article", "арт", "art", "код"],
  category: ["категория", "category", "группа", "group", "тип"],
  quantity: ["количество", "quantity", "кол-во", "qty", "кол", "count"],
  unit: ["ед.изм", "единица", "unit", "ед", "изм", "uom"],
  price: ["цена", "price", "стоимость", "сумма", "cost", "amount"],
  notes: ["примечание", "notes", "комментарий", "comment", "описание"],
}

function mapExcelHeaders(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {}
  const lowerHeaders = headers.map((h) => h.trim().toLowerCase())

  for (const [field, patterns] of Object.entries(COLUMN_PATTERNS)) {
    for (let i = 0; i < lowerHeaders.length; i++) {
      if (patterns.includes(lowerHeaders[i])) {
        mapping[field] = i
        break
      }
    }
  }

  // Partial match fallback
  if (!mapping["name"]) {
    for (let i = 0; i < lowerHeaders.length; i++) {
      if (lowerHeaders[i].includes("наимен") || lowerHeaders[i].includes("name") || lowerHeaders[i].includes("назв")) {
        mapping["name"] = i
        break
      }
    }
  }
  if (!mapping["quantity"]) {
    for (let i = 0; i < lowerHeaders.length; i++) {
      if (lowerHeaders[i].includes("кол") || lowerHeaders[i].includes("qty") || lowerHeaders[i].includes("quant")) {
        mapping["quantity"] = i
        break
      }
    }
  }

  return mapping
}

function parseExcelRows(jsonData: Record<string, unknown>[]): ParsedExcelRow[] {
  if (jsonData.length === 0) return []

  const headers = Object.keys(jsonData[0])
  const mapping = mapExcelHeaders(headers)

  if (!mapping["name"]) {
    throw new Error(
      "Не удалось найти колонку с наименованием. Ожидаемые заголовки: наименование, name, название, позиция"
    )
  }

  return jsonData.map((row, index) => {
    const getValue = (field: string): string | undefined => {
      const colIndex = mapping[field]
      if (colIndex === undefined) return undefined
      const val = row[headers[colIndex]]
      if (val === null || val === undefined) return undefined
      return String(val).trim()
    }

    const qtyStr = getValue("quantity")
    const priceStr = getValue("price")

    return {
      rowNumber: index + 1,
      name: getValue("name") || `Позиция ${index + 1}`,
      article: getValue("article"),
      category: getValue("category"),
      quantity: qtyStr ? parseFloat(qtyStr.replace(",", ".")) || 0 : 0,
      unit: getValue("unit"),
      price: priceStr ? parseFloat(priceStr.replace(",", ".")) || undefined : undefined,
      notes: getValue("notes"),
    }
  })
}

// ---------------------------------------------------------------------------
// Status badge helper
// ---------------------------------------------------------------------------

function getBOMStatusVariant(
  status: string
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "draft":
      return "outline"
    case "locked":
      return "secondary"
    case "active":
      return "default"
    default:
      return "outline"
  }
}

// ---------------------------------------------------------------------------
// BOM Section
// ---------------------------------------------------------------------------

export function BOMSection({ projectId }: { projectId: string }) {
  const [state, setState] = useState<BOMSectionState>({ kind: "loading" })
  const [suppliers, setSuppliers] = useState<CounterpartyData[]>([])
  const [editingCell, setEditingCell] = useState<EditableCell | null>(null)
  const [editValue, setEditValue] = useState("")
  const [savingItemId, setSavingItemId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [excelFile, setExcelFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // -----------------------------------------------------------------------
  // Data fetching
  // -----------------------------------------------------------------------

  const fetchBOM = useCallback(async () => {
    setState({ kind: "loading" })
    try {
      const response = await bomApi.getBOM(projectId)
      const bom = response.data
      const items = bom.items || []
      setState({ kind: "has-bom", bom, items })
    } catch (err) {
      if (err instanceof ApiClientError && err.statusCode === 404) {
        setState({ kind: "no-bom" })
      } else {
        const msg = err instanceof ApiClientError ? err.message : "Failed to load BOM"
        setState({ kind: "error", message: msg })
      }
    }
  }, [projectId])

  const fetchSuppliers = useCallback(async () => {
    try {
      const response = await counterpartiesApi.getCounterparties({ type: "supplier" })
      setSuppliers(response.data)
    } catch {
      // Non-critical; suppliers dropdown will be empty
    }
  }, [])

  useEffect(() => {
    fetchBOM()
    fetchSuppliers()
  }, [fetchBOM, fetchSuppliers])

  // -----------------------------------------------------------------------
  // Excel handling
  // -----------------------------------------------------------------------

  const handleExcelFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setExcelFile(file)
    setActionError(null)

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const XLSX = await import("xlsx")
        const data = new Uint8Array(evt.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) {
          throw new Error("Файл не содержит листов")
        }
        const sheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" })
        if (jsonData.length === 0) {
          throw new Error("Файл не содержит данных")
        }
        const rows = parseExcelRows(jsonData)
        setState({ kind: "uploading-excel", rows })
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : "Ошибка при чтении Excel файла"
        )
        setExcelFile(null)
      }
    }
    reader.onerror = () => {
      setActionError("Ошибка при чтении файла")
      setExcelFile(null)
    }
    reader.readAsArrayBuffer(file)

    // Reset input
    e.target.value = ""
  }

  const handleConfirmExcel = async () => {
    if (state.kind !== "uploading-excel") return

    setState({ kind: "creating-bom" })
    setActionError(null)

    const items: BOMItemCreateInput[] = state.rows.map((row) => ({
      rowNumber: row.rowNumber,
      name: row.name,
      article: row.article || null,
      category: row.category || null,
      quantity: row.quantity,
      unit: row.unit || null,
      price: row.price ?? null,
      notes: row.notes || null,
    }))

    try {
      const response = await bomApi.createBOM({ projectId, items })
      const bom = response.data
      setState({ kind: "has-bom", bom, items: bom.items || [] })
      setExcelFile(null)
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Failed to create BOM"
      setState({ kind: "error", message: msg })
    }
  }

  const handleCancelExcel = () => {
    setExcelFile(null)
    setState({ kind: "no-bom" })
    setActionError(null)
  }

  // -----------------------------------------------------------------------
  // Create empty BOM
  // -----------------------------------------------------------------------

  const handleCreateEmptyBOM = async () => {
    setState({ kind: "creating-bom" })
    setActionError(null)

    try {
      const response = await bomApi.createBOM({ projectId, items: [] })
      const bom = response.data
      setState({ kind: "has-bom", bom, items: [] })
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Failed to create BOM"
      setState({ kind: "error", message: msg })
    }
  }

  // -----------------------------------------------------------------------
  // Item CRUD
  // -----------------------------------------------------------------------

  const handleAddRow = async () => {
    if (state.kind !== "has-bom") return

    const newRowNumber =
      state.items.length > 0
        ? Math.max(...state.items.map((i) => i.rowNumber)) + 1
        : 1

    const newItem: BOMItemCreateInput = {
      rowNumber: newRowNumber,
      name: "",
      quantity: 1,
      unit: "шт",
    }

    try {
      const response = await bomApi.addBOMItems(state.bom.id, [newItem])
      const created = response.data[0]
      if (!created) throw new Error("No item returned")

      setState({
        kind: "has-bom",
        bom: state.bom,
        items: [...state.items, created],
      })
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Failed to add item"
      setActionError(msg)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (state.kind !== "has-bom") return

    try {
      await bomApi.deleteBOMItem(itemId)
      setState({
        kind: "has-bom",
        bom: state.bom,
        items: state.items.filter((i) => i.id !== itemId),
      })
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Failed to delete item"
      setActionError(msg)
    }
  }

  const startEditing = (itemId: string, field: EditableCell["field"], currentValue: string | number | null) => {
    setEditingCell({ itemId, field })
    setEditValue(currentValue?.toString() ?? "")
    setActionError(null)
  }

  const commitEdit = async () => {
    if (!editingCell || state.kind !== "has-bom") return

    const { itemId, field } = editingCell
    setSavingItemId(itemId)

    try {
      const update: BOMItemUpdateInput = {}
      if (field === "name" || field === "unit" || field === "article" || field === "category") {
        ;(update as Record<string, string | null>)[field] = editValue || null
      } else if (field === "quantity" || field === "price") {
        ;(update as Record<string, number | null>)[field] = editValue ? parseFloat(editValue) : null
      }

      const response = await bomApi.updateBOMItem(itemId, update)
      setState({
        kind: "has-bom",
        bom: state.bom,
        items: state.items.map((i) => (i.id === itemId ? response.data : i)),
      })
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Failed to save"
      setActionError(msg)
    } finally {
      setEditingCell(null)
      setSavingItemId(null)
    }
  }

  const cancelEdit = () => {
    setEditingCell(null)
    setEditValue("")
  }

  const handleCellKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      commitEdit()
    } else if (e.key === "Escape") {
      e.preventDefault()
      cancelEdit()
    }
  }

  // -----------------------------------------------------------------------
  // Supplier assignment
  // -----------------------------------------------------------------------

  const handleSupplierChange = async (itemId: string, supplierId: string) => {
    if (state.kind !== "has-bom") return

    // The Select component may pass empty string
    const effectiveId = supplierId || ""

    // Optimistic update
    const supplier = effectiveId
      ? suppliers.find((s) => s.id === effectiveId) || null
      : null
    setState({
      kind: "has-bom",
      bom: state.bom,
      items: state.items.map((i) =>
        i.id === itemId ? { ...i, supplierId: effectiveId || null, supplier } : i
      ),
    })

    try {
      await bomApi.updateBOMItem(itemId, {
        supplierId: effectiveId || null,
      })
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Failed to update supplier"
      setActionError(msg)
      // Revert on failure — refetch
      fetchBOM()
    }
  }

  // -----------------------------------------------------------------------
  // Lock / Unlock
  // -----------------------------------------------------------------------

  const handleLock = async () => {
    if (state.kind !== "has-bom") return
    try {
      const response = await bomApi.lockBOM(state.bom.id)
      setState({ kind: "has-bom", bom: response.data, items: state.items })
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Failed to lock BOM"
      setActionError(msg)
    }
  }

  const handleUnlock = async () => {
    if (state.kind !== "has-bom") return
    try {
      const response = await bomApi.unlockBOM(state.bom.id)
      setState({ kind: "has-bom", bom: response.data, items: state.items })
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Failed to unlock BOM"
      setActionError(msg)
    }
  }

  // -----------------------------------------------------------------------
  // Computed values
  // -----------------------------------------------------------------------

  const isLocked = state.kind === "has-bom" && state.bom.status === "locked"
  const total =
    state.kind === "has-bom"
      ? state.items.reduce((sum, i) => sum + (i.quantity || 0) * Number(i.price || 0), 0)
      : 0

  // -----------------------------------------------------------------------
  // Render helpers
  // -----------------------------------------------------------------------

  const renderEditableCell = (
    item: BOMItemData,
    field: EditableCell["field"],
    displayValue: string | number,
    className = ""
  ) => {
    if (isLocked) {
      return <span className={className}>{displayValue || "\—"}</span>
    }

    const isEditing =
      editingCell?.itemId === item.id && editingCell?.field === field
    const isSaving = savingItemId === item.id

    if (isEditing) {
      return (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleCellKeyDown}
          disabled={isSaving}
          className="h-7 w-full min-w-[80px] text-sm"
          autoFocus
        />
      )
    }

    return (
      <button
        type="button"
        className={`cursor-pointer rounded px-1 py-0.5 text-left text-sm hover:bg-muted ${className}`}
        onClick={() => startEditing(item.id, field, item[field] as string | number | null)}
      >
        {displayValue || "\—"}
      </button>
    )
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  if (state.kind === "loading") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-4" />
            Спецификация (BOM)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Загрузка...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (state.kind === "error") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-4" />
            Спецификация (BOM)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-3 py-6">
            <AlertCircle className="size-8 text-destructive" />
            <p className="text-sm text-destructive">{state.message}</p>
            <Button variant="outline" size="sm" onClick={fetchBOM}>
              Повторить
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (state.kind === "creating-bom") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-4" />
            Спецификация (BOM)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Создание спецификации...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (state.kind === "no-bom") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-4" />
            Спецификация (BOM)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-6">
            <FileSpreadsheet className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Спецификация ещё не создана. Загрузите Excel-файл или создайте пустую спецификацию.
            </p>

            {actionError && (
              <div className="flex items-center gap-1.5 text-sm text-destructive">
                <AlertCircle className="size-3.5" />
                {actionError}
              </div>
            )}

            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelFileSelect}
                className="hidden"
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="size-4" />
                <span className="ml-1.5">Загрузить Excel</span>
              </Button>
              <Button variant="outline" onClick={handleCreateEmptyBOM}>
                <Plus className="size-4" />
                <span className="ml-1.5">Создать пустую</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (state.kind === "uploading-excel") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="size-4" />
            Спецификация (BOM) — Предпросмотр
          </CardTitle>
        </CardHeader>
        <CardContent>
          {actionError && (
            <div className="mb-3 flex items-center gap-1.5 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              <AlertCircle className="size-3.5 shrink-0" />
              {actionError}
            </div>
          )}

          <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <FileSpreadsheet className="size-4" />
            {excelFile?.name ?? "Excel файл"}
            <span className="text-muted-foreground/70">
              ({state.rows.length} позиций)
            </span>
          </div>

          <div className="mb-4 max-h-64 overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Наименование</TableHead>
                  <TableHead className="w-20">Артикул</TableHead>
                  <TableHead className="w-16">Кол-во</TableHead>
                  <TableHead className="w-16">Ед.</TableHead>
                  <TableHead className="w-24">Цена</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.rows.map((row) => (
                  <TableRow key={row.rowNumber}>
                    <TableCell>{row.rowNumber}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.article || "\—"}</TableCell>
                    <TableCell>{row.quantity}</TableCell>
                    <TableCell>{row.unit || "\—"}</TableCell>
                    <TableCell>
                      {row.price != null ? Number(row.price).toLocaleString("ru-RU") : "\—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleConfirmExcel}>
              <CheckCircle2 className="size-4" />
              <span className="ml-1.5">Подтвердить и создать BOM</span>
            </Button>
            <Button variant="outline" onClick={handleCancelExcel}>
              <X className="size-4" />
              <span className="ml-1.5">Отмена</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // has-bom
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="size-4" />
            Спецификация (BOM)
            <Badge variant={getBOMStatusVariant(state.bom.status)}>
              {state.bom.status === "draft"
                ? "Черновик"
                : state.bom.status === "locked"
                  ? "Заблокирован"
                  : state.bom.status}
            </Badge>
          </div>
          <div className="flex gap-2">
            {isLocked ? (
              <Button variant="outline" size="sm" onClick={handleUnlock}>
                <Unlock className="size-3.5" />
                <span className="ml-1">Разблокировать</span>
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={handleLock}>
                <Lock className="size-3.5" />
                <span className="ml-1">Заблокировать</span>
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {actionError && (
          <div className="mb-3 flex items-center gap-1.5 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
            <AlertCircle className="size-3.5 shrink-0" />
            {actionError}
            <button
              type="button"
              className="ml-auto shrink-0"
              onClick={() => setActionError(null)}
            >
              <X className="size-3.5" />
            </button>
          </div>
        )}

        {state.items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <p className="text-sm text-muted-foreground">Спецификация пуста</p>
            {!isLocked && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleExcelFileSelect}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="size-3.5" />
                    <span className="ml-1">Загрузить Excel</span>
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleAddRow}>
                    <Plus className="size-3.5" />
                    <span className="ml-1">Добавить строку</span>
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="mb-3 overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Наименование</TableHead>
                    <TableHead className="w-24">Артикул</TableHead>
                    <TableHead className="w-20">Категория</TableHead>
                    <TableHead className="w-20">Кол-во</TableHead>
                    <TableHead className="w-16">Ед.</TableHead>
                    <TableHead className="w-24">Цена</TableHead>
                    <TableHead className="w-24">Сумма</TableHead>
                    <TableHead className="w-48">Поставщик</TableHead>
                    {!isLocked && <TableHead className="w-12" />}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-muted-foreground">{item.rowNumber}</TableCell>
                      <TableCell>
                        {renderEditableCell(item, "name", item.name)}
                      </TableCell>
                      <TableCell>
                        {renderEditableCell(item, "article", item.article ?? "", "text-xs")}
                      </TableCell>
                      <TableCell>
                        {renderEditableCell(item, "category", item.category ?? "", "text-xs")}
                      </TableCell>
                      <TableCell>
                        {renderEditableCell(item, "quantity", item.quantity)}
                      </TableCell>
                      <TableCell>
                        {renderEditableCell(item, "unit", item.unit ?? "")}
                      </TableCell>
                      <TableCell>
                        {renderEditableCell(item, "price", item.price != null ? Number(item.price) : "")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {((item.quantity || 0) * Number(item.price || 0)).toLocaleString(
                          "ru-RU",
                          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                        )}
                      </TableCell>
                      <TableCell>
                        {isLocked ? (
                          <span className="text-sm">
                            {item.supplier
                              ? `${item.supplier.name}${item.supplier.inn ? ` (ИНН ${item.supplier.inn})` : ""}`
                              : "\—"}
                          </span>
                        ) : (
                          <Select
                            value={item.supplierId ?? ""}
                            onValueChange={(value) =>
                              handleSupplierChange(item.id, value ?? "")
                            }
                          >
                            <SelectTrigger size="sm" className="w-full min-w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">— Не выбран —</SelectItem>
                              {suppliers.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
                                  {s.inn ? ` (ИНН ${s.inn})` : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      {!isLocked && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Footer: Total + Add row */}
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-muted-foreground">Всего позиций: </span>
                <span className="font-medium">{state.items.length}</span>
                <span className="mx-2 text-muted-foreground">|</span>
                <span className="text-muted-foreground">Итого: </span>
                <span className="font-medium">
                  {total.toLocaleString("ru-RU", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              {!isLocked && (
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleExcelFileSelect}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="size-3.5" />
                    <span className="ml-1">Excel</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleAddRow}>
                    <Plus className="size-3.5" />
                    <span className="ml-1">Добавить строку</span>
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

BOMSection.displayName = "BOMSection"
