"use client";

import { useEffect, useState } from "react";
import { ROLE_MATRIX, type RoleCode } from "@/lib/auth/roles";

interface UserRow {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  lastLoginAt: string | null;
  roleCodes: RoleCode[];
  roleNames: string[];
}

const ROLE_CODES = Object.keys(ROLE_MATRIX) as RoleCode[];

function toggle(arr: RoleCode[], code: RoleCode): RoleCode[] {
  return arr.includes(code) ? arr.filter((c) => c !== code) : [...arr, code];
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [createRoles, setCreateRoles] = useState<RoleCode[]>(["manager_designer"]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

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
  useEffect(() => {
    load();
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

  async function patch(id: string, body: Record<string, unknown>) {
    setErr(null);
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error || "Ошибка");
      return;
    }
    load();
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
                <td>{u.isActive ? "активен" : "заблокирован"}</td>
                <td className="space-x-2 whitespace-nowrap">
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
    </div>
  );
}
