"use client"

import * as React from "react"
import { Combobox } from "@base-ui/react/combobox"
import { ChevronDownIcon, CheckIcon, XIcon, Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

export type SearchEntityType = "contact" | "counterparty" | "contract" | "project" | "user" | "deal"

export interface EntitySearchOption {
  value: string
  label: string
  sublabel?: string | null
}

interface EntitySearchSelectProps {
  /** Тип сущности — определяет, что ищем (contact/counterparty/contract/project/user/deal). */
  type: SearchEntityType
  /** Выбранный id (null/undefined = не выбрано). */
  value?: string | null
  /** (id, опция) при выборе; (null, null) при очистке. */
  onValueChange: (value: string | null, option?: EntitySearchOption | null) => void
  placeholder?: string
  disabled?: boolean
  id?: string
  /** Фильтр по типу контрагента (только для type="counterparty"). */
  counterpartyType?: string
  /** Фильтр по типу контакта (только для type="contact"): person | company. */
  contactType?: "person" | "company"
  className?: string
  /** Ширина выпадающего списка (по умолчанию — как у триггера). */
  popupClassName?: string
}

/**
 * Переиспользуемый searchable select с серверным поиском (SS-01).
 * Ищет через GET /api/search/entities (debounce 250ms, отмена устаревших запросов).
 */
export function EntitySearchSelect({
  type,
  value,
  onValueChange,
  placeholder = "Поиск…",
  disabled,
  id,
  counterpartyType,
  contactType,
  className,
  popupClassName,
}: EntitySearchSelectProps) {
  const [query, setQuery] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [options, setOptions] = React.useState<EntitySearchOption[]>([])
  const [loading, setLoading] = React.useState(false)
  const [selectedOption, setSelectedOption] = React.useState<EntitySearchOption | null>(null)

  const abortRef = React.useRef<AbortController | null>(null)
  const selectedOptionRef = React.useRef<EntitySearchOption | null>(null)
  selectedOptionRef.current = selectedOption
  const searchTimerRef = React.useRef<number | null>(null)

  const fetchOptions = React.useCallback(
    async (q: string, extraIds?: string[]) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      try {
        const params = new URLSearchParams({ type, q, limit: "20" })
        if (counterpartyType) params.set("counterpartyType", counterpartyType)
        if (contactType) params.set("contactType", contactType)
        if (extraIds && extraIds.length > 0) params.set("ids", extraIds.join(","))
        const res = await fetch(`/api/search/entities?${params.toString()}`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`Search failed: ${res.status}`)
        const json = (await res.json()) as {
          data?: Array<{ id: string; label: string; sublabel?: string | null }>
        }
        if (controller.signal.aborted) return
        setOptions(
          (json.data ?? []).map((it) => ({
            value: it.id,
            label: it.label,
            sublabel: it.sublabel,
          }))
        )
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return
        setOptions([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    },
    [type, counterpartyType, contactType]
  )

  // Резолв label текущего значения (edit-формы с предзаполнением).
  React.useEffect(() => {
    if (!value) {
      setSelectedOption(null)
      setQuery("")
      return
    }
    const existing = options.find((o) => o.value === value)
    if (existing) {
      setSelectedOption(existing)
      return
    }
    let cancelled = false
    const params = new URLSearchParams({ type, ids: value })
    fetch(`/api/search/entities?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json: { data?: Array<{ id: string; label: string; sublabel?: string | null }> }) => {
        if (cancelled) return
        const item = (json.data ?? [])[0]
        if (item) {
          const option: EntitySearchOption = {
            value: item.id,
            label: item.label,
            sublabel: item.sublabel,
          }
          setSelectedOption(option)
          setQuery(option.label)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, type])

  // Debounced поиск при вводе.
  React.useEffect(() => {
    if (!open) return
    const selectedLabel = selectedOptionRef.current?.label
    // После выбора input заполнен label — ищем по пустой строке (недавние записи).
    const effectiveQuery = query && query !== selectedLabel ? query : ""
    if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current)
    searchTimerRef.current = window.setTimeout(() => {
      void fetchOptions(effectiveQuery)
    }, 250)
    return () => {
      if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current)
    }
  }, [query, open, fetchOptions])

  React.useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  const handleValueChange = React.useCallback(
    (next: string | null) => {
      if (next == null) {
        setQuery("")
        setSelectedOption(null)
        onValueChange(null)
        return
      }
      const opt = options.find((o) => o.value === next) ?? selectedOption
      if (opt) {
        setSelectedOption(opt)
        // Показываем label в input сразу (не ждём заполнения от Base UI).
        setQuery(opt.label)
      }
      onValueChange(next, opt ?? null)
    },
    [options, selectedOption, onValueChange]
  )

  const handleInputChange = React.useCallback((text: string) => {
    setQuery(text)
  }, [])

  // Base UI заполняет input после выбора через itemToStringLabel —
  // по умолчанию это String(value) (uuid), нам нужен читаемый label.
  const itemToStringLabel = React.useCallback(
    (itemValue: string) => {
      const opt = options.find((o) => o.value === itemValue)
      if (opt) return opt.label
      const current = selectedOptionRef.current
      if (current && current.value === itemValue) return current.label
      return String(itemValue)
    },
    [options]
  )

  const handleOpenChange = React.useCallback(
    (isOpen: boolean) => {
      setOpen(isOpen)
      if (isOpen) {
        const selectedLabel = selectedOptionRef.current?.label
        if (query && query === selectedLabel) {
          setQuery("")
        }
      }
    },
    [query]
  )

  const handleClear = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setQuery("")
      setSelectedOption(null)
      onValueChange(null)
    },
    [onValueChange]
  )

  return (
    <Combobox.Root
      value={value ?? null}
      onValueChange={handleValueChange}
      inputValue={query}
      onInputValueChange={handleInputChange}
      onOpenChange={handleOpenChange}
      filter={null}
      items={options.map((o) => o.value)}
      itemToStringLabel={itemToStringLabel}
      autoHighlight
      disabled={disabled}
    >
      <div className={cn("relative", className)}>
        <Combobox.Trigger
          data-slot="entity-search-trigger"
          className={cn(
            "flex h-9 w-full items-center gap-1 rounded-lg border border-input bg-transparent px-2.5 pr-8 text-sm outline-none transition-colors",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "dark:bg-input/30 dark:hover:bg-input/50"
          )}
        >
          <Combobox.Input
            id={id}
            data-slot="entity-search-input"
            placeholder={placeholder}
            className="h-full w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <Combobox.Icon
            render={
              <ChevronDownIcon className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 shrink-0 text-muted-foreground" />
            }
          />
        </Combobox.Trigger>

        {value && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Очистить"
            onClick={handleClear}
            className="absolute right-6 top-1/2 z-10 flex size-4 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            <XIcon className="size-3.5" />
          </button>
        )}
      </div>

      <Combobox.Portal>
        <Combobox.Positioner
          side="bottom"
          sideOffset={4}
          align="start"
          className="isolate z-50"
        >
          <Combobox.Popup
            data-slot="entity-search-content"
            className={cn(
              "relative z-50 max-h-(--available-height) w-(--anchor-width) min-w-44 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10",
              "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
              popupClassName
            )}
          >
            <Combobox.List className="p-1">
              {options.map((option) => (
                <Combobox.Item
                  key={option.value}
                  value={option.value}
                  className={cn(
                    "relative flex w-full cursor-default items-center gap-2 rounded-md px-1.5 py-1.5 pr-8 text-sm outline-hidden select-none",
                    "data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                  )}
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{option.label}</span>
                    {option.sublabel && (
                      <span className="truncate text-xs text-muted-foreground">{option.sublabel}</span>
                    )}
                  </span>
                  <Combobox.ItemIndicator
                    render={
                      <span className="pointer-events-none absolute right-2 flex size-4 items-center justify-center" />
                    }
                  >
                    <CheckIcon className="size-4" />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              ))}
            </Combobox.List>
            {loading && (
              <div key="loading" className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                <Loader2Icon className="size-4 animate-spin" />
                Поиск…
              </div>
            )}
            {!loading && options.length === 0 && (
              <div key="empty" className="px-3 py-2 text-center text-sm text-muted-foreground">
                Ничего не найдено
              </div>
            )}
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}
