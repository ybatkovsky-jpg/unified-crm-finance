"use client";

import { useEffect, useState } from "react";
import { ROLE_MATRIX, type RoleCode } from "@/lib/auth/roles";

interface UserRow {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  lastLoginAt: string | null;
  roleCode: RoleCode | null;
  roleName: string | null;
}

const ROLE_CODES = Object.keys(ROLE_MATRIX) as RoleCode[];

export default function UsersAdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [roleCode, setRoleCode] = useState<RoleCode>("manager_designer");
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
      body: JSON.stringify({ email, name, password, roleCode }),
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

  if (forbidden) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Управление пользователями доступно только директору.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Пользователи и роли</h1>

      {err && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-md p-2">{err}</div>
      )}
      {msg && (
        <div className="text-sm text-emerald-600 bg-emerald-50 rounded-md p-2">{msg}</div>
      )}

      <form
        onSubmit={create}
        className="grid grid-cols-1 md:grid-cols-5 gap-2 bg-muted/30 p-4 rounded-lg"
      >
        <input
          className="rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="ФИО"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="пароль"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <select
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={roleCode}
          onChange={(e) => setRoleCode(e.target.value as RoleCode)}
        >
          {ROLE_CODES.map((c) => (
            <option key={c} value={c}>
              {ROLE_MATRIX[c].label}
            </option>
          ))}
        </select>
        <button
          className="rounded-md bg-primary text-primary-foreground py-2 text-sm font-medium"
          type="submit"
        >
          Создать
        </button>
      </form>

      {loading ? (
        <p className="text-muted-foreground">Загрузка…</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b">
              <th className="py-2">Email</th>
              <th>ФИО</th>
              <th>Роль</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="py-2">{u.email}</td>
                <td>{u.name}</td>
                <td>
                  <select
                    className="rounded border bg-background px-2 py-1 text-xs"
                    value={u.roleCode ?? ""}
                    onChange={(e) => patch(u.id, { roleCode: e.target.value })}
                  >
                    {ROLE_CODES.map((c) => (
                      <option key={c} value={c}>
                        {ROLE_MATRIX[c].label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{u.isActive ? "активен" : "заблокирован"}</td>
                <td className="space-x-2 whitespace-nowrap">
                  <button
                    className="text-xs underline"
                    onClick={() => patch(u.id, { isActive: !u.isActive })}
                  >
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
