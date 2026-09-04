"use client";

import { useEffect, useState } from "react";
import { ROLE_MATRIX, type RoleCode } from "@/lib/auth/roles";
import { getFunctions, assignUser, unassignUser, type FunctionData } from "@/lib/api/org";

interface UserRow {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  lastLoginAt: string | null;
  roleCodes: RoleCode[];
  roleNames: string[];
}

interface UserAssign {
  assignmentId: string;
  functionId: string;
  functionName: string;
  departmentName: string;
  role: "head" | "responsible";
}

const ROLE_CODES = Object.keys(ROLE_MATRIX) as RoleCode[];

function toggle(arr: RoleCode[], code: RoleCode): RoleCode[] {
  return arr.includes(code) ? arr.filter((c) => c !== code) : [...arr, code];
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  // Орг-функции и назначения (для «Назначить на функцию»)
  const [functions, setFunctions] = useState<FunctionData[]>([]);
  const [assignByUser, setAssignByUser] = useState<Record<string, UserAssign[]>>({});

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [createRoles, setCreateRoles] = useState<RoleCode[]>(["manager_designer"]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Диалог назначения на функцию
  const [assignFor, setAssignFor] = useState<UserRow | null>(null);
  const [assignFnSel, setAssignFnSel] = useState("");
  const [assignRoleSel, setAssignRoleSel] = useState<"head" | "responsible">("responsible");

  // Диалог редактирования пользователя
  const [editFor, setEditFor] = useState<UserRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRoles, setEditRoles] = useState<RoleCode[]>([]);
  const [editActive, setEditActive] = useState(true);
  const [editPassword, setEditPassword] = useState("");
  const [editErr, setEditErr] = useState<string | null>(null);
  const [editBusy, setEditBusy] = useState(false);

  function openEdit(u: UserRow) {
    setEditFor(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRoles([...u.roleCodes]);
    setEditActive(u.isActive);
    setEditPassword("");
    setEditErr(null);
  }

  async function saveEdit() {
    if (!editFor) return;
    const name = editName.trim();
    const email = editEmail.trim();
    if (!name || !email) {
      setEditErr("Укажите ФИО и email");
      return;
    }
    if (editRoles.length === 0) {
      setEditErr("Должна быть хотя бы одна роль");
      return;
    }
    const body: Record<string, unknown> = {
      name,
      email,
      roleCodes: editRoles,
      isActive: editActive,
    };
    if (editPassword.trim()) body.password = editPassword.trim();
    setEditBusy(true);
    setEditErr(null);
    const ok = await patch(editFor.id, body);
    setEditBusy(false);
    if (ok) {
      setEditFor(null);
      setEditPassword("");
      setMsg(`Данные пользователя ${email} сохранены`);
    }
  }

  async function load() {
    const res = await fetch("/api/users");
    if (res.status === 403) {
      setForbidden(true);
      setLoading(false);
      return;
    }
    const data = await res.json().catch(() => ({ data: [] }));
    setUsers(data.data ?? []);
    setLoading(false);
  }

  async function loadOrg() {
    try {
      const res = await getFunctions();
      const fns = res.data ?? [];
      setFunctions(fns);
      const map: Record<string, UserAssign[]> = {};
      for (const fn of fns) {
        for (const a of fn.FunctionAssignment ?? []) {
          if (!map[a.userId]) map[a.userId] = [];
          map[a.userId].push({
            assignmentId: a.id,
            functionId: fn.id,
            functionName: fn.name,
            departmentName: fn.Department?.name ?? "—",
            role: a.role,
          });
        }
      }
      setAssignByUser(map);
    } catch {
      // орг-структура может быть недоступна — не критично
    }
  }

  useEffect(() => {
    load();
    loadOrg();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password, roleCodes: createRoles }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.error || "Ошибка создания");
      return;
    }
    setMsg(`Создан пользователь: ${email}`);
    setEmail("");
    setName("");
    setPassword("");
    setCreateRoles(["manager_designer"]);
    load();
  }

  async function patch(id: string, body: Record<string, unknown>): Promise<boolean> {
    setErr(null);
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "Ошибка");
      return false;
    }
    load();
    return true;
  }

  async function remove(id: string, label: string) {
    if (!window.confirm(`Удалить пользователя ${label}? (мягкое удаление — история сохранится)`)) return;
    setErr(null);
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "Ошибка удаления");
      return;
    }
    load();
  }

  async function handleAssign() {
    if (!assignFor || !assignFnSel) return;
    setErr(null);
    try {
      await assignUser({ functionId: assignFnSel, userId: assignFor.id, role: assignRoleSel });
      setAssignFor(null);
      setAssignFnSel("");
      setAssignRoleSel("responsible");
      await loadOrg();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка назначения");
    }
  }

  async function handleUnassign(assignmentId: string) {
    setErr(null);
    try {
      await unassignUser(assignmentId);
      await loadOrg();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка снятия назначения");
    }
  }

  if (forbidden) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Управление пользователями доступно только директору.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Пользователи и роли</h1>
        <p className="text-sm text-muted-foreground">
          У одного пользователя может быть несколько ролей — права объединяются.
        </p>
      </div>

      {err && <div className="text-sm text-destructive bg-destructive/10 rounded-md p-2">{err}</div>}
      {msg && <div className="text-sm text-emerald-600 bg-emerald-50 rounded-md p-2">{msg}</div>}

      <form onSubmit={create} className="space-y-3 bg-muted/30 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="ФИО" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="rounded-md border bg-background px-3 py-2 text-sm" placeholder="пароль" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button className="rounded-md bg-primary text-primary-foreground py-2 text-sm font-medium" type="submit">Создать</button>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {ROLE_CODES.map((c) => (
            <label key={c} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={createRoles.includes(c)}
                onChange={() => setCreateRoles((r) => toggle(r, c))}
              />
              {ROLE_MATRIX[c].label}
            </label>
          ))}
        </div>
      </form>

      {loading ? (
        <p className="text-muted-foreground">Загрузка…</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b">
              <th className="py-2">Email</th>
              <th>ФИО</th>
              <th>Роли</th>
              <th>Функции</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b align-top">
                <td className="py-2">{u.email}</td>
                <td>{u.name}</td>
                <td>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 max-w-md">
                    {ROLE_CODES.map((c) => (
                      <label key={c} className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={u.roleCodes.includes(c)}
                          onChange={() => patch(u.id, { roleCodes: toggle(u.roleCodes, c) })}
                        />
                        {ROLE_MATRIX[c].label}
                      </label>
                    ))}
                  </div>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1 max-w-sm">
                    {(assignByUser[u.id] ?? []).map((a) => (
                      <span key={a.assignmentId} className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[11px]">
                        {a.role === "head" ? "👑 " : ""}{a.departmentName} · {a.functionName}
                        <button className="hover:text-destructive" title="Снять" onClick={() => handleUnassign(a.assignmentId)}>×</button>
                      </span>
                    ))}
                    <button
                      className="text-xs underline text-primary"
                      onClick={() => { setAssignFor(u); setAssignFnSel(""); setAssignRoleSel("responsible"); }}
                    >
                      + Назначить
                    </button>
                  </div>
                </td>
                <td>{u.isActive ? "активен" : "заблокирован"}</td>
                <td className="space-x-2 whitespace-nowrap">
                  <button className="text-xs underline" onClick={() => openEdit(u)}>
                    Редактировать
                  </button>
                  <button className="text-xs underline" onClick={() => patch(u.id, { isActive: !u.isActive })}>
                    {u.isActive ? "Заблокировать" : "Активировать"}
                  </button>
                  <button
                    className="text-xs underline"
                    onClick={() => {
                      const p = window.prompt(`Новый пароль для ${u.email}:`);
                      if (p && p.length >= 4) patch(u.id, { password: p });
                    }}
                  >
                    Сбросить пароль
                  </button>
                  <button className="text-xs underline text-destructive" onClick={() => remove(u.id, u.email)}>
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Диалог назначения на функцию */}
      {assignFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setAssignFor(null)}>
          <div className="w-full max-w-md rounded-lg border bg-card p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg">Назначить на функцию</h3>
            <p className="text-sm text-muted-foreground mb-4">{assignFor.name} ({assignFor.email})</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Функция</label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={assignFnSel}
                  onChange={(e) => setAssignFnSel(e.target.value)}
                >
                  <option value="">Выберите функцию…</option>
                  {functions.map((fn) => (
                    <option key={fn.id} value={fn.id}>
                      {fn.Department?.name ?? "—"} → {fn.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Роль</label>
                <select
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={assignRoleSel}
                  onChange={(e) => setAssignRoleSel(e.target.value as "head" | "responsible")}
                >
                  <option value="responsible">Ответственный</option>
                  <option value="head">Руководитель (видит все задачи функции)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button className="rounded-md border px-3 py-2 text-sm" onClick={() => setAssignFor(null)}>Отмена</button>
              <button className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium" onClick={handleAssign} disabled={!assignFnSel}>
                Назначить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Диалог редактирования пользователя */}
      {editFor && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto p-4"
          onClick={() => { if (!editBusy) { setEditFor(null); setEditErr(null); } }}
        >
          <form
            className="w-full max-w-lg my-8 rounded-lg border bg-card p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => { e.preventDefault(); saveEdit(); }}
          >
            <h3 className="font-semibold text-lg">Редактировать пользователя</h3>
            <p className="text-sm text-muted-foreground">{editFor.email}</p>

            {editErr && <div className="text-sm text-destructive bg-destructive/10 rounded-md p-2 mt-3">{editErr}</div>}

            <div className="space-y-3 mt-4">
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="edit-name">ФИО *</label>
                <input
                  id="edit-name"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="edit-email">Email *</label>
                <input
                  id="edit-email"
                  type="email"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Роли *</label>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {ROLE_CODES.map((c) => (
                    <label key={c} className="flex items-center gap-1.5 text-sm">
                      <input
                        type="checkbox"
                        checked={editRoles.includes(c)}
                        onChange={() => setEditRoles((r) => toggle(r, c))}
                      />
                      {ROLE_MATRIX[c].label}
                    </label>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                />
                Активен (может входить в систему)
              </label>
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="edit-password">Новый пароль</label>
                <input
                  id="edit-password"
                  type="password"
                  placeholder="Оставьте пустым, чтобы не менять"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                type="button"
                className="rounded-md border px-3 py-2 text-sm"
                onClick={() => { setEditFor(null); setEditErr(null); }}
              >
                Отмена
              </button>
              <button
                type="submit"
                className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium"
                disabled={editBusy}
              >
                {editBusy ? "Сохранение…" : "Сохранить"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
