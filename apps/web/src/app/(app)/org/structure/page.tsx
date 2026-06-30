"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCwIcon, PlusIcon, Trash2Icon, UsersIcon, Building2Icon } from "lucide-react"
import { ApiClientError } from "@/lib/api/shared"
import {
  getDepartments, createDepartment, deleteDepartment,
  getFunctions, createFunction, deleteFunction,
  assignUser, unassignUser,
  type DepartmentData, type FunctionData, type AssignmentData,
} from "@/lib/api/org"
import { useMe } from "@/components/layout/use-me"
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

  const isDirector = !!me?.roleCodes?.includes("director")

  const [newDeptName, setNewDeptName] = useState("")
  const [newFnDept, setNewFnDept] = useState("")
  const [newFnName, setNewFnName] = useState("")
  const [assignDialog, setAssignDialog] = useState<{ functionId: string; functionName: string } | null>(null)
  const [assignUserSel, setAssignUserSel] = useState("")
  const [assignRoleSel, setAssignRoleSel] = useState<"head" | "responsible">("responsible")

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
        <Button variant="outline" onClick={fetchAll}>
          <RefreshCwIcon className="size-4" /><span className="ml-1.5">Обновить</span>
        </Button>
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

      {/* Дерево: отделы → функции */}
      {departments.length === 0 ? (
        <Card><CardContent className="pt-6">
          <p className="text-center text-muted-foreground py-8">Нет отделов. Создайте первый.</p>
        </CardContent></Card>
      ) : (
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
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteDept(dept.id, dept.name)}>
                      <Trash2Icon className="size-4 text-destructive" />
                    </Button>
                  </div>
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
      )}

      {/* Добавить функцию (если есть отделы) */}
      {departments.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 items-end">
              <div className="space-y-1.5">
                <Label>Отдел</Label>
                <Select value={newFnDept} onValueChange={(v) => setNewFnDept(v ?? "")}>
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
              <Select value={assignUserSel} onValueChange={(v) => setAssignUserSel(v ?? "")}>
                <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
                <SelectContent>
                  {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Роль</Label>
              <Select value={assignRoleSel} onValueChange={(v) => setAssignRoleSel(v as "head" | "responsible")}>
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
    </div>
  )
}
