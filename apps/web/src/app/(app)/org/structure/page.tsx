"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCwIcon, PlusIcon, Trash2Icon, UsersIcon, Building2Icon, GitForkIcon, ListTreeIcon } from "lucide-react"
import { ApiClientError } from "@/lib/api/shared"
import {
  getDepartments, createDepartment, deleteDepartment,
  getFunctions, createFunction, deleteFunction,
  assignUser, unassignUser,
  type DepartmentData, type FunctionData, type AssignmentData,
} from "@/lib/api/org"
import { useMe } from "@/components/layout/use-me"
import { ROLE_MATRIX, type RoleCode } from "@/lib/auth/roles"
import { OrgChart } from "@/components/org/org-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface UserOption { id: string; name: string; email: string }

export default function OrgStructurePage() {
  const { me, loading: meLoading } = useMe()
  const [departments, setDepartments] = useState<DepartmentData[]>([])
  const [functions, setFunctions] = useState<FunctionData[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [view, setView] = useState<"list" | "chart">("list")

  const isDirector = !!me?.roleCodes?.includes("director")

  const [newDeptName, setNewDeptName] = useState("")
  const [newFnDept, setNewFnDept] = useState("")
  const [newFnName, setNewFnName] = useState("")
  // Инлайн-добавление функции прямо в карточке отдела
  const [inlineDeptId, setInlineDeptId] = useState<string | null>(null)
  const [inlineFnName, setInlineFnName] = useState("")
  const [assignDialog, setAssignDialog] = useState<{ functionId: string; functionName: string } | null>(null)
  const [assignUserSel, setAssignUserSel] = useState("")
  const [assignRoleSel, setAssignRoleSel] = useState<"head" | "responsible">("responsible")

  // Создание сотрудника (пользователя) прямо из оргструктуры
  const [createUserOpen, setCreateUserOpen] = useState(false)
  const [nuEmail, setNuEmail] = useState("")
  const [nuName, setNuName] = useState("")
  const [nuPassword, setNuPassword] = useState("")
  const [nuRoles, setNuRoles] = useState<string[]>(["manager_designer"])
  const [nuBusy, setNuBusy] = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [d, f] = await Promise.all([getDepartments(), getFunctions()])
      setDepartments(d.data)
      setFunctions(f.data)
      if (isDirector) {
        const ur = await fetch("/api/users")
        if (ur.ok) {
          const uj = await ur.json()
          setUsers(uj.data ?? [])
        }
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Не удалось загрузить структуру.")
    } finally { setLoading(false) }
  }, [isDirector])

  useEffect(() => { if (!meLoading) fetchAll() }, [fetchAll, meLoading])

  const handleAddDept = async () => {
    if (!newDeptName.trim()) return
    setBusy(true)
    try {
      await createDepartment({ name: newDeptName.trim() })
      setNewDeptName("")
      await fetchAll()
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Ошибка")
    } finally { setBusy(false) }
  }

  const handleAddFunction = async () => {
    if (!newFnDept || !newFnName.trim()) return
    setBusy(true)
    try {
      await createFunction({ departmentId: newFnDept, name: newFnName.trim() })
      setNewFnName("")
      await fetchAll()
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Ошибка")
    } finally { setBusy(false) }
  }

  const handleInlineAddFunction = async (departmentId: string) => {
    if (!inlineFnName.trim()) return
    setBusy(true)
    try {
      await createFunction({ departmentId, name: inlineFnName.trim() })
      setInlineFnName("")
      setInlineDeptId(null)
      await fetchAll()
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Ошибка")
    } finally { setBusy(false) }
  }

  const handleDeleteDept = async (id: string, name: string) => {
    if (!confirm(`Удалить отдел «${name}» вместе со всеми функциями?`)) return
    setBusy(true)
    try {
      await deleteDepartment(id)
      await fetchAll()
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Ошибка")
    } finally { setBusy(false) }
  }

  const handleDeleteFunction = async (id: string, name: string) => {
    if (!confirm(`Удалить функцию «${name}»?`)) return
    setBusy(true)
    try {
      await deleteFunction(id)
      await fetchAll()
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Ошибка")
    } finally { setBusy(false) }
  }

  const handleAssign = async () => {
    if (!assignDialog || !assignUserSel) return
    setBusy(true)
    try {
      await assignUser({ functionId: assignDialog.functionId, userId: assignUserSel, role: assignRoleSel })
      setAssignDialog(null); setAssignUserSel(""); setAssignRoleSel("responsible")
      await fetchAll()
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Ошибка")
    } finally { setBusy(false) }
  }

  const handleUnassign = async (a: AssignmentData) => {
    setBusy(true)
    try {
      await unassignUser(a.id)
      await fetchAll()
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Ошибка")
    } finally { setBusy(false) }
  }

  const toggleRole = (arr: string[], code: string) =>
    arr.includes(code) ? arr.filter((c) => c !== code) : [...arr, code]

  const handleCreateUser = async () => {
    if (!nuEmail.trim() || !nuName.trim() || !nuPassword) {
      setError("Заполните email, ФИО и пароль")
      return
    }
    setNuBusy(true); setError(null)
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: nuEmail.trim(), name: nuName.trim(), password: nuPassword, roleCodes: nuRoles }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || "Ошибка создания сотрудника")
      }
      setCreateUserOpen(false)
      setNuEmail(""); setNuName(""); setNuPassword(""); setNuRoles(["manager_designer"])
      await fetchAll()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка создания сотрудника")
    } finally { setNuBusy(false) }
  }

  if (meLoading || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center py-12">
          <RefreshCwIcon className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Загрузка...</span>
        </div>
      </div>
    )
  }

  if (!isDirector) {
    return (
      <div className="container mx-auto p-6">
        <Card><CardContent className="pt-6">
          <p className="text-center text-muted-foreground py-8">
            Управление орг-структурой доступно только директору.
          </p>
        </CardContent></Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Орг-структура</h1>
          <p className="text-sm text-muted-foreground">Отделы → функции → ответственные</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border overflow-hidden">
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              <ListTreeIcon className="size-4" /> Список
            </button>
            <button
              onClick={() => setView("chart")}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${view === "chart" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              <GitForkIcon className="size-4" /> Схема
            </button>
          </div>
          <Button variant="outline" onClick={fetchAll}>
            <RefreshCwIcon className="size-4" /><span className="ml-1.5">Обновить</span>
          </Button>
          <Button onClick={() => setCreateUserOpen(true)}>
            <UsersIcon className="size-4" /><span className="ml-1.5">Добавить сотрудника</span>
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive"><CardContent className="pt-6">
          <p className="text-destructive text-sm">{error}</p>
        </CardContent></Card>
      )}

      {/* Добавить отдел */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="dept-name">Новый отдел</Label>
              <Input id="dept-name" value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)}
                placeholder="Напр. Маркетинг" onKeyDown={(e) => e.key === "Enter" && handleAddDept()} />
            </div>
            <Button onClick={handleAddDept} disabled={busy || !newDeptName.trim()}>
              <PlusIcon className="size-4" /><span className="ml-1.5">Добавить</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Дерево: отделы → функции (список) */}
      {view === "list" && departments.length === 0 ? (
        <Card><CardContent className="pt-6">
          <p className="text-center text-muted-foreground py-8">Нет отделов. Создайте первый.</p>
        </CardContent></Card>
      ) : view === "list" ? (
        <div className="space-y-4">
          {departments.map((dept) => {
            const deptFunctions = functions.filter((f) => f.departmentId === dept.id)
            return (
              <Card key={dept.id}>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Building2Icon className="size-5 text-muted-foreground" />
                      <h3 className="font-semibold text-lg">{dept.name}</h3>
                      <Badge variant="secondary">{deptFunctions.length} функц.</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" onClick={() => { setInlineDeptId(inlineDeptId === dept.id ? null : dept.id); setInlineFnName("") }}>
                        <PlusIcon className="size-3.5" /><span className="ml-1">Функция</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteDept(dept.id, dept.name)}>
                        <Trash2Icon className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {inlineDeptId === dept.id && (
                    <div className="flex items-end gap-2">
                      <div className="flex-1 space-y-1.5">
                        <Label htmlFor={`inline-fn-${dept.id}`}>Новая функция в отделе «{dept.name}»</Label>
                        <Input id={`inline-fn-${dept.id}`} value={inlineFnName} onChange={(e) => setInlineFnName(e.target.value)}
                          placeholder="Напр. Реклама, Налоги" autoFocus
                          onKeyDown={(e) => e.key === "Enter" && handleInlineAddFunction(dept.id)} />
                      </div>
                      <Button onClick={() => handleInlineAddFunction(dept.id)} disabled={busy || !inlineFnName.trim()}>
                        <PlusIcon className="size-4" /><span className="ml-1.5">Добавить</span>
                      </Button>
                    </div>
                  )}
                  {dept.description && <p className="text-sm text-muted-foreground">{dept.description}</p>}

                  {deptFunctions.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic pl-7">Нет функций</p>
                  ) : (
                    <div className="space-y-3 pl-7 border-l-2 border-muted ml-1">
                      {deptFunctions.map((fn) => (
                        <div key={fn.id} className="pl-4 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <UsersIcon className="size-4 text-muted-foreground" />
                              <span className="font-medium">{fn.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="outline" size="sm" onClick={() => {
                                setAssignDialog({ functionId: fn.id, functionName: fn.name })
                                setAssignUserSel(""); setAssignRoleSel("responsible")
                              }}>
                                <PlusIcon className="size-3.5" /><span className="ml-1">Назначить</span>
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteFunction(fn.id, fn.name)}>
                                <Trash2Icon className="size-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          {fn.FunctionAssignment && fn.FunctionAssignment.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {fn.FunctionAssignment.map((a) => (
                                <Badge
                                  key={a.id}
                                  variant={a.role === "head" ? "default" : "secondary"}
                                  className="gap-1 cursor-default"
                                >
                                  {a.role === "head" ? "👑 " : ""}{a.User.name}
                                  <button
                                    onClick={() => handleUnassign(a)}
                                    className="ml-1 hover:text-destructive"
                                    title="Снять"
                                  >×</button>
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">Нет назначений</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : null}

      {/* Схема орг-структуры */}
      {view === "chart" && (
        departments.length === 0 ? (
          <Card><CardContent className="pt-6">
            <p className="text-center text-muted-foreground py-8">Нет отделов. Создайте первый.</p>
          </CardContent></Card>
        ) : (
          <Card><CardContent className="pt-6">
            <OrgChart departments={departments} functions={functions} />
          </CardContent></Card>
        )
      )}

      {/* Добавить функцию (если есть отделы) */}
      {view === "list" && departments.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 items-end">
              <div className="space-y-1.5">
                <Label>Отдел</Label>
                <Select
                  value={newFnDept}
                  onValueChange={(v) => setNewFnDept(v ?? "")}
                  items={Object.fromEntries(departments.map((d) => [d.id, d.name]))}
                >
                  <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Новая функция</Label>
                <Input value={newFnName} onChange={(e) => setNewFnName(e.target.value)}
                  placeholder="Напр. Реклама, Налоги" onKeyDown={(e) => e.key === "Enter" && handleAddFunction()} />
              </div>
              <Button onClick={handleAddFunction} disabled={busy || !newFnDept || !newFnName.trim()}>
                <PlusIcon className="size-4" /><span className="ml-1.5">Добавить</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Диалог назначения */}
      <Dialog open={!!assignDialog} onOpenChange={(o) => !o && setAssignDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Назначить на функцию «{assignDialog?.functionName}»</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Сотрудник</Label>
              <Select
                value={assignUserSel}
                onValueChange={(v) => setAssignUserSel(v ?? "")}
                items={Object.fromEntries(users.map((u) => [u.id, `${u.name} (${u.email})`]))}
              >
                <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Роль</Label>
              <Select value={assignRoleSel} onValueChange={(v) => setAssignRoleSel(v as "head" | "responsible")} items={{ responsible: "Ответственный", head: "Руководитель (видит все задачи функции)" }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="responsible">Ответственный</SelectItem>
                  <SelectItem value="head">Руководитель (видит все задачи функции)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Отмена</DialogClose>
            <Button onClick={handleAssign} disabled={busy || !assignUserSel}>Назначить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог создания сотрудника */}
      <Dialog open={createUserOpen} onOpenChange={(o) => !o && setCreateUserOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить сотрудника</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="nu-email">Email</Label>
              <Input id="nu-email" value={nuEmail} onChange={(e) => setNuEmail(e.target.value)} placeholder="user@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nu-name">ФИО</Label>
              <Input id="nu-name" value={nuName} onChange={(e) => setNuName(e.target.value)} placeholder="Иванов Иван" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nu-pass">Пароль</Label>
              <Input id="nu-pass" type="password" value={nuPassword} onChange={(e) => setNuPassword(e.target.value)} placeholder="мин. 4 символа" />
            </div>
            <div className="space-y-1.5">
              <Label>Роли</Label>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {(Object.keys(ROLE_MATRIX) as RoleCode[]).map((c) => (
                  <label key={c} className="flex items-center gap-1.5 text-sm">
                    <input type="checkbox" checked={nuRoles.includes(c)} onChange={() => setNuRoles((r) => toggleRole(r, c))} />
                    {ROLE_MATRIX[c].label}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Отмена</DialogClose>
            <Button onClick={handleCreateUser} disabled={nuBusy}>
              {nuBusy ? "Создание..." : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
